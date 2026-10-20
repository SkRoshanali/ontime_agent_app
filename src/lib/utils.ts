import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME } from './config';
import { verifySession, type SessionPayload } from './auth';

/**
 * Get the session token from cookies.
 */
export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value || null;
}

/**
 * Verify and return the current session.
 */
export async function getCurrentSession(): Promise<SessionPayload | null> {
  const token = await getSessionToken();
  if (!token) return null;
  return verifySession(token);
}

/**
 * Create a JSON error response.
 */
export function errorResponse(message: string, status: number) {
  return new Response(JSON.stringify({ success: false, error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Create a JSON success response.
 */
export function successResponse<T>(data: T, status: number = 200) {
  return new Response(JSON.stringify({ success: true, data }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
