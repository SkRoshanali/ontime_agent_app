import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/db/client';
import { orders, order_status_history } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { errorResponse, successResponse } from '@/lib/utils';

const statusSchema = z.object({
  status: z.enum(['CANCELLED', 'FAILED']),
  notes: z.string().min(1, 'Notes are required'),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userId || userRole !== 'agent') {
      return errorResponse('Unauthorized', 401);
    }

    const body = await request.json();
    const { status, notes } = statusSchema.parse(body);

    const { id: orderId } = await params;

    // Update order status
    const updated = await db
      .update(orders)
      .set({
        status,
        notes,
      })
      .where(eq(orders.id, orderId))
      .returning();

    if (updated.length === 0) {
      return errorResponse('Order not found', 404);
    }

    // Log status change
    await db.insert(order_status_history).values({
      order_id: orderId,
      status,
      changed_by: userId,
      notes,
      changed_at: new Date(),
    });

    return successResponse({ order: updated[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message, 400);
    }
    console.error('Order status error:', error);
    return errorResponse('Internal server error', 500);
  }
}
