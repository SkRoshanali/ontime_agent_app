import { NextRequest } from 'next/server';
import { z } from 'zod';
import { findUserByEmail } from '@/db/queries';
import {
  verifyPassword,
  createSession,
  getSessionCookie,
  type SessionPayload,
} from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/utils';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    // Find user by email
    const user = await findUserByEmail(email);
    if (!user) {
      return errorResponse('Invalid email or password', 401);
    }

    // Verify password
    const passwordValid = await verifyPassword(password, user.password_hash);
    if (!passwordValid) {
      return errorResponse('Invalid email or password', 401);
    }

    // Create session token
    const payload: SessionPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as 'admin' | 'agent' | 'customer',
    };
    const token = await createSession(payload);

    // Create response
    const response = successResponse(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          phone_verified: user.phone_verified,
        },
      },
      200
    );

    // Set session cookie
    response.headers.set('Set-Cookie', getSessionCookie(token));

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message, 400);
    }
    console.error('Login error:', error);
    return errorResponse('Internal server error', 500);
  }
}
