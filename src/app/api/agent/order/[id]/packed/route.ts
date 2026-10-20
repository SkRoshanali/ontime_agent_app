import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/db/client';
import { orders, order_items, order_status_history } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { errorResponse, successResponse } from '@/lib/utils';

const packOrderSchema = z.object({
  unavailableItemIds: z.array(z.number()).optional(),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userId || userRole !== 'agent') {
      return errorResponse('Unauthorized', 401);
    }

    const { id: orderId } = await params;
    const body = await request.json();
    const { unavailableItemIds } = packOrderSchema.parse(body);

    // Update order in transaction
    const result = await db.transaction(async (tx) => {
      // Update order - set packed_at but keep status as IN_TRIP
      const updated = await tx
        .update(orders)
        .set({
          packed_at: new Date(),
        })
        .where(eq(orders.id, orderId))
        .returning();

      if (updated.length === 0) {
        throw new Error('Order not found');
      }

      // Mark items as unavailable if specified
      if (unavailableItemIds && unavailableItemIds.length > 0) {
        for (const itemId of unavailableItemIds) {
          await tx
            .update(order_items)
            .set({ unavailable: true })
            .where(eq(order_items.id, itemId));
        }
      }

      // Log status change (packing action, not a status change)
      await tx.insert(order_status_history).values({
        order_id: orderId,
        status: 'PACKED',
        changed_by: userId,
        changed_at: new Date(),
        notes: unavailableItemIds?.length ? `${unavailableItemIds.length} items marked unavailable` : undefined,
      });

      return updated[0];
    });

    return successResponse({ order: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message, 400);
    }
    console.error('Pack order error:', error);
    return errorResponse('Internal server error', 500);
  }
}
