import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/db/client';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { errorResponse, successResponse } from '@/lib/utils';

const verifyPhoneSchema = z.object({
  phone: z.string().min(1, 'Phone number is required'),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetUserId } = await params;
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userId || userRole !== 'admin') {
      return errorResponse('Unauthorized', 401);
    }

    const body = await request.json();
    const { phone } = verifyPhoneSchema.parse(body);

    // Get user
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, targetUserId));

    if (user.length === 0) {
      return errorResponse('User not found', 404);
    }

    // Update phone and mark as verified
    const updated = await db
      .update(users)
      .set({
        phone,
        phone_verified: true,
      })
      .where(eq(users.id, targetUserId))
      .returning();

    if (updated.length === 0) {
      return errorResponse('Failed to update phone', 500);
    }

    const updatedUser = updated[0];

    return successResponse({
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        phone_verified: updatedUser.phone_verified,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message, 400);
    }
    console.error('Verify phone error:', error);
    return errorResponse('Internal server error', 500);
  }
}
