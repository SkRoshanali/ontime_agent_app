import { NextRequest } from 'next/server';
import { getOrderItemsForOrder } from '@/db/queries';
import { errorResponse, successResponse } from '@/lib/utils';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userId || userRole !== 'agent') {
      return errorResponse('Unauthorized', 401);
    }

    const { id: orderId } = await params;

    const items = await getOrderItemsForOrder(orderId);

    return successResponse({ items });
  } catch (error) {
    console.error('Get order items error:', error);
    return errorResponse('Internal server error', 500);
  }
}
