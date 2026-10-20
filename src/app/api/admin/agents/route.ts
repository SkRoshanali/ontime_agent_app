import { NextRequest } from 'next/server';
import { db } from '@/db/client';
import { users, batches } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { errorResponse, successResponse } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const userRole = request.headers.get('x-user-role');

    if (userRole !== 'admin') {
      return errorResponse('Unauthorized', 401);
    }

    // Get all agents
    const agents = await db
      .select()
      .from(users)
      .where(eq(users.role, 'agent'));

    // Get batch info for each agent
    const agentsWithBatches = await Promise.all(
      agents.map(async (agent) => {
        const activeBatch = await db
          .select()
          .from(batches)
          .where(eq(batches.agent_id, agent.id))
          .orderBy(batches.created_at);

        return {
          id: agent.id,
          name: agent.name,
          email: agent.email,
          phone: agent.phone,
          phone_verified: agent.phone_verified,
          created_at: agent.created_at,
          batches: activeBatch,
        };
      })
    );

    return successResponse({
      agents: agentsWithBatches,
      count: agentsWithBatches.length,
    });
  } catch (error) {
    console.error('Get agents error:', error);
    return errorResponse('Internal server error', 500);
  }
}
