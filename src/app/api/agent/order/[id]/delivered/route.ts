import { NextRequest } from 'next/server';
import { db } from '@/db/client';
import { orders, order_status_history, batches } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { errorResponse, successResponse } from '@/lib/utils';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userId || userRole !== 'agent') {
      return errorResponse('Unauthorized', 401);
    }

    const { id: orderId } = await params;

    // Update order status in transaction
    const result = await db.transaction(async (tx) => {
      // Update order
      const updated = await tx
        .update(orders)
        .set({
          status: 'DELIVERED',
          delivered_at: new Date(),
        })
        .where(eq(orders.id, orderId))
        .returning();

      if (updated.length === 0) {
        throw new Error('Order not found');
      }

      // Log status change
      await tx.insert(order_status_history).values({
        order_id: orderId,
        status: 'DELIVERED',
        changed_by: userId,
        changed_at: new Date(),
      });

      // Check if all orders in batch are delivered
      const batchId = updated[0].batch_id;
      if (batchId) {
        const undeliveredOrders = await tx
          .select()
          .from(orders)
          .where(and(eq(orders.batch_id, batchId), eq(orders.status, 'OUT_FOR_DELIVERY')));

        if (undeliveredOrders.length === 0) {
          // All orders delivered, complete batch
          await tx
            .update(batches)
            .set({
              status: 'COMPLETED',
              completed_at: new Date(),
            })
            .where(eq(batches.id, batchId));
        }
      }

      return updated[0];
    });

    return successResponse({ order: result });
  } catch (error) {
    console.error('Deliver order error:', error);
    return errorResponse('Internal server error', 500);
  }
}
