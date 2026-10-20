import { NextRequest } from 'next/server';
import { db } from '@/db/client';
import { orders, batches, order_status_history } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { MAX_ORDERS_PER_BATCH } from '@/lib/config';
import { errorResponse, successResponse } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userId || userRole !== 'agent') {
      return errorResponse('Unauthorized', 401);
    }

    // Self-healing: cancel any empty PICKING batches for this agent
    await db
      .update(batches)
      .set({ status: 'CANCELLED' })
      .where(
        and(
          eq(batches.agent_id, userId),
          eq(batches.status, 'PICKING'),
          sql`NOT EXISTS (SELECT 1 FROM ${orders} WHERE ${orders.batch_id} = ${batches.id} AND (${orders.status} = 'IN_TRIP' OR ${orders.status} = 'OUT_FOR_DELIVERY'))`
        )
      );

    // Atomic transaction: check for available orders, then create batch and claim them
    const result = await db.transaction(async (tx) => {
      // Build query for oldest PLACED orders
      let query = tx
        .select()
        .from(orders)
        .where(eq(orders.status, 'PLACED'))
        .orderBy(orders.placed_at);

      // Apply limit only if MAX_ORDERS_PER_BATCH is not null
      if (MAX_ORDERS_PER_BATCH !== null) {
        query = query.limit(MAX_ORDERS_PER_BATCH);
      }

      const claimedOrders = await query;

      // If no orders available, rollback and return error (no batch created)
      if (claimedOrders.length === 0) {
        return { batch: null, orders: [], shouldRollback: true };
      }

      // Create batch only if we have orders
      const newBatch = await tx
        .insert(batches)
        .values({
          agent_id: userId,
          status: 'PICKING',
          created_at: new Date(),
        })
        .returning();

      const batchId = newBatch[0].id;

      // Update orders to claim them
      const orderIds = claimedOrders.map((o) => o.id);
      for (const orderId of orderIds) {
        await tx
          .update(orders)
          .set({
            agent_id: userId,
            batch_id: batchId,
            status: 'IN_TRIP',
            claimed_at: new Date(),
          })
          .where(eq(orders.id, orderId));

        // Log status change
        await tx.insert(order_status_history).values({
          order_id: orderId,
          status: 'IN_TRIP',
          changed_by: userId,
          changed_at: new Date(),
        });
      }

      return {
        batch: newBatch[0],
        orders: claimedOrders,
        shouldRollback: false,
      };
    });

    // If no orders were available, return 409 Conflict
    if (result.shouldRollback) {
      return errorResponse('No orders waiting', 409);
    }

    return successResponse({
      batch: result.batch,
      orders: result.orders,
      orderCount: result.orders.length,
    });
  } catch (error) {
    console.error('Batch claim error:', error);
    return errorResponse('Internal server error', 500);
  }
}
