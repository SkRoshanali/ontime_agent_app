import { NextRequest } from 'next/server';
import { db } from '@/db/client';
import { orders } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { errorResponse, successResponse } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const userRole = request.headers.get('x-user-role');

    if (!userRole || (userRole !== 'agent' && userRole !== 'admin')) {
      return errorResponse('Unauthorized', 401);
    }

    // Get count of orders with status PLACED
    const result = await db
      .select()
      .from(orders)
      .where(eq(orders.status, 'PLACED'));

    const count = result.length;

    return successResponse({ count });
  } catch (error) {
    console.error('Get unclaimed count error:', error);
    return errorResponse('Internal server error', 500);
  }
}
