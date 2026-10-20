import { NextRequest } from 'next/server';
import { db } from '@/db/client';
import { orders, batches, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { errorResponse, successResponse } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const userRole = request.headers.get('x-user-role');

    if (userRole !== 'admin') {
      return errorResponse('Unauthorized', 401);
    }

    const placedCount = await db
      .select()
      .from(orders)
      .where(eq(orders.status, 'PLACED'));

    const inTripCount = await db
      .select()
      .from(orders)
      .where(eq(orders.status, 'IN_TRIP'));

    const outForDeliveryCount = await db
      .select()
      .from(orders)
      .where(eq(orders.status, 'OUT_FOR_DELIVERY'));

    const agents = await db.select().from(users).where(eq(users.role, 'agent'));

    const agentsWithBatches = await Promise.all(
      agents.map(async (agent) => {
        const batch = await db
          .select()
          .from(batches)
          .where(and(eq(batches.agent_id, agent.id), eq(batches.status, 'PICKING')))
          .limit(1);

        const agentOrders = batch[0]
          ? await db
              .select()
              .from(orders)
              .where(eq(orders.batch_id, batch[0].id))
          : [];

        return {
          id: agent.id,
          name: agent.name,
          batch: batch[0] || null,
          orderCount: agentOrders.length,
        };
      })
    );

    const unclaimedOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.status, 'PLACED'))
      .orderBy(orders.placed_at)
      .limit(10);

    const pickingBatches = await db
      .select()
      .from(batches)
      .where(eq(batches.status, 'PICKING'));

    return successResponse({
      stats: {
        placed: placedCount.length,
        inTrip: inTripCount.length,
        outForDelivery: outForDeliveryCount.length,
      },
      agents: agentsWithBatches,
      unclaimedOrders,
      pickingBatches,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return errorResponse('Internal server error', 500);
  }
}
