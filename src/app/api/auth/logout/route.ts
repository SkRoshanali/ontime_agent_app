import { NextRequest } from 'next/server';
import { getClearSessionCookie } from '@/lib/auth';
import { successResponse } from '@/lib/utils';

export async function POST(_request: NextRequest) {
  const response = successResponse({ message: 'Logged out successfully' }, 200);
  response.headers.set('Set-Cookie', getClearSessionCookie());
  return response;
}
