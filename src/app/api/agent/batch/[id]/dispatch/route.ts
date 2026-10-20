import { NextRequest } from 'next/server';
import { db } from '@/db/client';
import { orders, batches, order_status_history } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { errorResponse, successResponse } from '@/lib/utils';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userId || userRole !== 'agent') {
      return errorResponse('Unauthorized', 401);
    }

    const { id: batchId } = await params;

    // Update batch and orders in transaction
    const result = await db.transaction(async (tx) => {
      // Get all orders in batch
      const batchOrders = await tx
        .select()
        .from(orders)
        .where(eq(orders.batch_id, Number(batchId)));

      if (batchOrders.length === 0) {
        throw new Error('Batch not found or has no orders');
      }

      // Check if all orders are packed
      const unpackedOrders = batchOrders.filter((o) => !o.packed_at);
      if (unpackedOrders.length > 0) {
        throw new Error('All orders must be packed before dispatch');
      }

      // Update batch status to OUT_FOR_DELIVERY
      await tx
        .update(batches)
        .set({
          status: 'OUT_FOR_DELIVERY',
          dispatched_at: new Date(),
        })
        .where(eq(batches.id, Number(batchId)));

      // Update all orders in batch to OUT_FOR_DELIVERY
      for (const order of batchOrders) {
        await tx
          .update(orders)
          .set({
            status: 'OUT_FOR_DELIVERY',
            dispatched_at: new Date(),
          })
          .where(eq(orders.id, order.id));

        // Log status change
        await tx.insert(order_status_history).values({
          order_id: order.id,
          status: 'OUT_FOR_DELIVERY',
          changed_by: userId,
          changed_at: new Date(),
        });
      }

      return {
        batch: { id: Number(batchId), status: 'OUT_FOR_DELIVERY' },
        ordersUpdated: batchOrders.length,
      };
    });

    return successResponse(result);
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, 400);
    }
    console.error('Batch dispatch error:', error);
    return errorResponse('Internal server error', 500);
  }
}
