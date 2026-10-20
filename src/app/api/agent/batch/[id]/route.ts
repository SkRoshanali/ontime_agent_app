import { NextRequest } from 'next/server';
import { db } from '@/db/client';
import { batches, orders, order_items, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { errorResponse, successResponse } from '@/lib/utils';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userId || userRole !== 'agent') {
      return errorResponse('Unauthorized', 401);
    }

    const { id: batchId } = await params;

    // Get batch
    const batchResult = await db
      .select()
      .from(batches)
      .where(eq(batches.id, Number(batchId)));

    if (batchResult.length === 0) {
      return errorResponse('Batch not found', 404);
    }

    const batch = batchResult[0];

    // Get all orders in batch with customer info
    const batchOrders = await db
      .select({
        id: orders.id,
        order_no: orders.order_no,
        status: orders.status,
        total: orders.total,
        address_line1: orders.address_line1,
        address_line2: orders.address_line2,
        city: orders.city,
        pincode: orders.pincode,
        lat: orders.lat,
        lng: orders.lng,
        delivery_phone: orders.delivery_phone,
        placed_at: orders.placed_at,
        claimed_at: orders.claimed_at,
        packed_at: orders.packed_at,
        user_id: orders.user_id,
        user_name: users.name,
      })
      .from(orders)
      .leftJoin(users, eq(orders.user_id, users.id))
      .where(eq(orders.batch_id, Number(batchId)));

    // Aggregate items across all orders (for pick list)
    const itemMap = new Map<string, { quantity: number; name: string }>();
    for (const order of batchOrders) {
      const items = await db
        .select()
        .from(order_items)
        .where(eq(order_items.order_id, order.id));

      for (const item of items) {
        const current = itemMap.get(item.item_id) || { quantity: 0, name: item.name_snapshot };
        itemMap.set(item.item_id, {
          quantity: current.quantity + Number(item.quantity),
          name: item.name_snapshot,
        });
      }
    }

    const aggregatedItems = Array.from(itemMap.entries()).map(([itemId, data]) => ({
      itemId,
      quantity: data.quantity,
      name: data.name,
    }));

    return successResponse({
      batch,
      orders: batchOrders,
      aggregatedItems,
    });
  } catch (error) {
    console.error('Get batch error:', error);
    return errorResponse('Internal server error', 500);
  }
}
