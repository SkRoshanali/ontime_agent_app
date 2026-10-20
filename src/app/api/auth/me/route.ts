import { NextRequest } from 'next/server';
import { getCurrentSession } from '@/lib/utils';
import { findUserById } from '@/db/queries';
import { errorResponse, successResponse } from '@/lib/utils';

export async function GET(_request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return errorResponse('Unauthorized', 401);
    }

    const user = await findUserById(session.userId);
    if (!user) {
      return errorResponse('User not found', 404);
    }

    return successResponse({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone_verified: user.phone_verified,
      },
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return errorResponse('Internal server error', 500);
  }
}
