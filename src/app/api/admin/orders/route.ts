import { NextRequest } from 'next/server';
import { db } from '@/db/client';
import { orders } from '@/db/schema';
import { eq, and, gte, lte, SQL } from 'drizzle-orm';
import { errorResponse, successResponse } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const userRole = request.headers.get('x-user-role');

    if (userRole !== 'admin') {
      return errorResponse('Unauthorized', 401);
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Build where conditions
    const conditions: SQL[] = [];

    if (status) {
      conditions.push(eq(orders.status, status as 'PLACED' | 'IN_TRIP' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'FAILED'));
    }

    if (startDate) {
      conditions.push(gte(orders.placed_at, new Date(startDate)));
    }

    if (endDate) {
      conditions.push(lte(orders.placed_at, new Date(endDate)));
    }

    // Query orders
    let query = db.select().from(orders);

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const result = await query.limit(limit).offset(offset);

    return successResponse({
      orders: result,
      count: result.length,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Orders error:', error);
    return errorResponse('Internal server error', 500);
  }
}
