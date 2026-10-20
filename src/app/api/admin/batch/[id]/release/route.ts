import { NextRequest } from 'next/server';
import { db } from '@/db/client';
import { batches, orders, order_status_history } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { errorResponse, successResponse } from '@/lib/utils';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userId || userRole !== 'admin') {
      return errorResponse('Unauthorized', 401);
    }

    const batchId = Number(id);

    // Use transaction to atomically release batch and reset orders
    const result = await db.transaction(async (tx) => {
      // Get the batch
      const batch = await tx
        .select()
        .from(batches)
        .where(eq(batches.id, batchId));

      if (batch.length === 0) {
        throw new Error('Batch not found');
      }

      if (batch[0].status !== 'PICKING') {
        throw new Error('Only PICKING batches can be released');
      }

      // Get all orders in this batch that are IN_TRIP or OUT_FOR_DELIVERY
      const batchOrders = await tx
        .select()
        .from(orders)
        .where(
          and(
            eq(orders.batch_id, batchId),
            inArray(orders.status, ['IN_TRIP', 'OUT_FOR_DELIVERY'])
          )
        );

      // Reset only IN_TRIP or OUT_FOR_DELIVERY orders back to PLACED
      let resetCount = 0;
      for (const order of batchOrders) {
        await tx
          .update(orders)
          .set({
            status: 'PLACED',
            batch_id: null,
            agent_id: null,
            claimed_at: null,
          })
          .where(eq(orders.id, order.id));

        // Log status change
        await tx.insert(order_status_history).values({
          order_id: order.id,
          status: 'PLACED',
          changed_by: userId,
          changed_at: new Date(),
          notes: 'Reset by admin batch release',
        });

        resetCount++;
      }

      // Determine batch status based on reset count
      // If at least one order was reset, batch becomes CANCELLED, otherwise COMPLETED
      const newBatchStatus = resetCount > 0 ? 'CANCELLED' : 'COMPLETED';

      await tx
        .update(batches)
        .set({
          status: newBatchStatus,
        })
        .where(eq(batches.id, batchId));

      return { resetCount, newBatchStatus };
    });

    return successResponse({
      message: 'Batch released successfully',
      batchId,
      resetCount: result.resetCount,
      newBatchStatus: result.newBatchStatus,
    });
  } catch (error) {
    console.error('Release batch error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message.includes('not found') ? 404 : message.includes('Only PICKING') ? 400 : 500;
    return errorResponse(message, status);
  }
}
