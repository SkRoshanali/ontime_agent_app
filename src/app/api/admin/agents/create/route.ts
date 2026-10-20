import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/db/client';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/utils';

const createAgentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Phone must be a valid 10-digit number starting with 6-9'),
});

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userId || userRole !== 'admin') {
      return errorResponse('Unauthorized', 401);
    }

    const body = await request.json();
    const { name, email, password, phone } = createAgentSchema.parse(body);

    // Check if email already exists
    const existingEmail = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (existingEmail.length > 0) {
      return errorResponse('Email already exists', 409);
    }

    // Check if phone already exists
    const existingPhone = await db
      .select()
      .from(users)
      .where(eq(users.phone, phone));

    if (existingPhone.length > 0) {
      return errorResponse('Phone number already in use', 409);
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create agent
    const result = await db
      .insert(users)
      .values({
        name,
        email,
        password_hash: passwordHash,
        phone,
        role: 'agent',
        phone_verified: false,
      })
      .returning();

    if (result.length === 0) {
      return errorResponse('Failed to create agent', 500);
    }

    const agent = result[0];

    return successResponse(
      {
        agent: {
          id: agent.id,
          name: agent.name,
          email: agent.email,
          phone: agent.phone,
        },
      },
      201
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message, 400);
    }
    console.error('Create agent error:', error);
    return errorResponse('Internal server error', 500);
  }
}
