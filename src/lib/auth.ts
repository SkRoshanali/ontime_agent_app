import { jwtVerify, SignJWT } from 'jose';
import * as bcrypt from 'bcryptjs';
import type { JWTPayload } from 'jose';
import { SESSION_TIMEOUT_MINUTES, SESSION_COOKIE_NAME } from './config';

export interface SessionPayload extends JWTPayload {
  userId: string;
  email: string;
  role: 'admin' | 'agent' | 'customer';
}

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET environment variable is required');
  }
  return new TextEncoder().encode(secret);
}

/**
 * Create a new JWT session token.
 * Expires in SESSION_TIMEOUT_MINUTES.
 */
export async function createSession(payload: SessionPayload): Promise<string> {
  const secretKey = getSecretKey();
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = SESSION_TIMEOUT_MINUTES * 60;

  const jwt = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' } as { alg: string })
    .setIssuedAt(now)
    .setExpirationTime(now + expiresIn)
    .sign(secretKey);

  return jwt;
}

/**
 * Verify and decode a JWT session token.
 * Returns null if token is invalid or expired.
 */
export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const secretKey = getSecretKey();
    const verified = await jwtVerify(token, secretKey);
    return verified.payload as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Hash a password using bcryptjs (10 rounds).
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Verify a password against its hash.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Get cookie string for setting session in response.
 */
export function getSessionCookie(token: string): string {
  return `${SESSION_COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_TIMEOUT_MINUTES * 60}`;
}

/**
 * Get cookie string for clearing session.
 */
export function getClearSessionCookie(): string {
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}
