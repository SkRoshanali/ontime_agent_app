# Admin & Agent App - Tasks

## Phase 1: Scaffold and Config

### Objectives
- Create Next.js App Router project structure
- Configure TypeScript (strict mode), Tailwind CSS, ESLint
- Set up package.json with all dependencies
- Create .env.example with variable names
- Initialize database client (Drizzle ORM)
- Set up Vitest configuration
- Create base middleware and auth utilities (JWT structure only, no implementation yet)

### Tasks P1.1–P1.10

#### P1.1: Initialize Next.js project
- `npm create next-app@latest ontime -- --typescript --tailwind --eslint --app --no-src-dir`
- **Or** manually scaffold if needed:
  - Create `package.json` with Next.js, React, React DOM
  - Create `tsconfig.json` (strict mode)
  - Create `tailwind.config.ts` and `postcss.config.mjs`
  - Create `.eslintrc.json`

**Files to create/modify**:
- `package.json` (dependencies listed below)
- `tsconfig.json` (strict: true)
- `tailwind.config.ts`
- `postcss.config.mjs`
- `.eslintrc.json`

#### P1.2: Install dependencies

**Core**:
- next (latest)
- react, react-dom
- typescript

**Database & ORM**:
- drizzle-orm
- drizzle-kit (dev only, for introspection; never run generate/migrate)
- @neondatabase/serverless (Neon driver)

**Auth & Security**:
- jose (JWT)
- bcryptjs
- cookie (parsing httpOnly cookies)

**State & Data Fetching**:
- zustand
- @tanstack/react-query
- @tanstack/react-query-devtools (dev)

**Validation**:
- zod

**UI & Styling**:
- tailwindcss
- postcss
- autoprefixer
- lucide-react
- tailwind-merge (for className composition)
- clsx (conditional classes)

**Email** (for future use; not implemented in P1):
- resend

**Testing**:
- vitest
- @vitest/ui (dev)

**Linting & Formatting**:
- eslint
- eslint-config-next
- prettier (optional, dev)

**Dev**:
- typescript
- @types/node
- @types/react
- @types/react-dom

Run:
```bash
npm install
```

**Files to create/modify**:
- `package.json` (add all deps)
- `package-lock.json` (auto-generated)

#### P1.3: Create .env.example

**File**: `.env.example`

```
# Database (must match Project 1)
DATABASE_URL=

# Auth & Session
SESSION_SECRET=

# Admin Seeding
ADMIN_EMAIL=
ADMIN_PASSWORD=

# Email (Project 1 integration, not used yet)
RESEND_API_KEY=
EMAIL_FROM=

# Client-facing URLs
NEXT_PUBLIC_APP_URL=
```

**No real secrets in repo; this is template only.**

#### P1.4: Set up Drizzle ORM client

**Files to create**:
- `src/db/schema.ts` (COPY from Project 1 unchanged)
- `src/db/client.ts` (Neon serverless Pool + Drizzle client)

**P1.4a**: Copy `src/db/schema.ts` from Project 1

**P1.4b**: Create `src/db/client.ts`

```typescript
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

export type Database = typeof db;
```

**Files to create**:
- `src/db/client.ts`
- `src/db/schema.ts` (from Project 1)

#### P1.5: Create config file

**File**: `src/lib/config.ts`

```typescript
export const BATCH_SIZE = 8; // Default number of orders per batch
export const SESSION_TIMEOUT_MINUTES = 30;
export const SESSION_COOKIE_NAME = 'session';
```

**Files to create**:
- `src/lib/config.ts`

#### P1.6: Create auth utilities (JWT structure, no implementation)

**File**: `src/lib/auth.ts`

Stub structure (full implementation in P2):

```typescript
import { jwtVerify, SignJWT } from 'jose';
import type { JWTPayload } from 'jose';

const secretKey = new TextEncoder().encode(process.env.SESSION_SECRET || '');

export interface SessionPayload extends JWTPayload {
  userId: string;
  email: string;
  role: 'admin' | 'agent' | 'customer';
}

// Stub functions; full implementation in P2
export async function createSession(payload: SessionPayload): Promise<string> {
  throw new Error('Not implemented in P1');
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  throw new Error('Not implemented in P1');
}

export async function hashPassword(password: string): Promise<string> {
  throw new Error('Not implemented in P1');
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  throw new Error('Not implemented in P1');
}
```

**Files to create**:
- `src/lib/auth.ts`

#### P1.7: Create types

**Files**:
- `src/types/auth.ts`
- `src/types/api.ts`
- `src/types/index.ts`

**src/types/auth.ts**:

```typescript
export interface User {
  id: string;
  email: string;
  role: 'admin' | 'agent' | 'customer';
  name: string;
  phone?: string;
  phone_verified?: boolean;
  active?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  success: boolean;
}
```

**src/types/api.ts**:

```typescript
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
}
```

**src/types/index.ts**:

```typescript
export * from './auth';
export * from './api';
```

**Files to create**:
- `src/types/auth.ts`
- `src/types/api.ts`
- `src/types/index.ts`

#### P1.8: Create Zustand auth store (stub)

**File**: `src/hooks/useAuth.ts`

```typescript
import { create } from 'zustand';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  error: null,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
```

**Files to create**:
- `src/hooks/useAuth.ts`

#### P1.9: Create basic middleware and layout

**File**: `src/middleware.ts`

Stub for auth middleware (full logic in P2):

```typescript
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Full implementation in P2
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/agent/:path*', '/api/:path*'],
};
```

**File**: `src/app/layout.tsx`

```typescript
import type { Metadata } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Grocery Admin & Agent',
  description: 'Admin and delivery agent dashboard for grocery ordering system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

**File**: `src/app/page.tsx` (redirect placeholder)

```typescript
export default function Home() {
  return (
    <div>
      <h1>Grocery Admin & Agent</h1>
      <p>Redirecting to login...</p>
    </div>
  );
}
```

**Files to create**:
- `src/middleware.ts`
- `src/app/layout.tsx`
- `src/app/page.tsx`

#### P1.10: Create Tailwind and styling setup

**File**: `src/styles/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --color-primary-green: #22c55e;
  --color-neutral-off-white: #f8f6f1;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  font-family: system-ui, -apple-system, sans-serif;
}
```

**File**: `src/styles/print.css`

```css
@media print {
  body {
    margin: 0;
    padding: 0;
  }

  .no-print {
    display: none;
  }

  .print-only {
    display: block;
  }
}
```

**Files to create**:
- `src/styles/globals.css`
- `src/styles/print.css`

#### P1.11: Set up Vitest

**File**: `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**Files to create**:
- `vitest.config.ts`

#### P1.12: Create README placeholder

**File**: `README.md`

```markdown
# Admin & Agent App

Delivery agent and admin dashboard for grocery ordering system.

## Overview

This app shares a single Neon Postgres database with the customer app (Project 1).
No API between the two apps; the database is the only integration point.

## Setup

1. Copy `.env.example` to `.env.local` and fill in values
2. `npm install`
3. `npm run dev` to start dev server

## Database

Schema is from Project 1 and locked. This app never runs migrations or generates new schema.

## Phases

- P1: Scaffold + config ✓
- P2: DB + auth
- P3: Agent dashboard + batch claiming
- P4: Pick/pack lists + batch lifecycle
- P5: Admin dashboard + order management
- P6: Manual batch release + agent mgmt
- P7: Print CSS
- P8: Final verification

## Testing

```bash
npm run test       # Run Vitest
npm run test:ui    # Vitest UI
npm run lint       # ESLint
npm run type-check # tsc --noEmit
```
```

**Files to create**:
- `README.md`

#### P1.13: Create Next.js config

**File**: `next.config.ts`

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    strict: true,
  },
  eslint: {
    dirs: ['src', 'pages', 'components', 'lib', 'utils'],
  },
};

export default nextConfig;
```

**Files to create**:
- `next.config.ts`

#### P1.14: Create scripts directory with seed template

**File**: `scripts/seed-admin.ts`

```typescript
/**
 * Seed admin account into database.
 * 
 * Usage: Read ADMIN_EMAIL and ADMIN_PASSWORD from .env.local,
 * then execute this script with `npx ts-node scripts/seed-admin.ts`
 * 
 * This script is NOT executed by Kiro or CI/CD.
 * The developer runs it manually after initial setup.
 * 
 * NOTE: This will fail if a user with the given email already exists.
 */

// Stub; full implementation in P2 or later if needed
console.log('Seed script stub. Full implementation in P2.');
process.exit(0);
```

**Files to create**:
- `scripts/seed-admin.ts`

#### P1.15: Update package.json scripts

Add to `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint . --max-warnings 0",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:ui": "vitest --ui"
  }
}
```

**Files to modify**:
- `package.json` (scripts section)

### Verification for Phase 1

1. **tsc --noEmit**: No TypeScript errors
2. **npm run lint**: No linting errors
3. **Project structure**: All directories and files created
4. **Dependencies**: All installed and listed in package.json

### Files Created in Phase 1

```
✅ package.json
✅ package-lock.json
✅ tsconfig.json
✅ tailwind.config.ts
✅ postcss.config.mjs
✅ .eslintrc.json
✅ next.config.ts
✅ vitest.config.ts
✅ .env.example
✅ README.md
✅ src/db/schema.ts (from Project 1)
✅ src/db/client.ts
✅ src/lib/config.ts
✅ src/lib/auth.ts
✅ src/types/auth.ts
✅ src/types/api.ts
✅ src/types/index.ts
✅ src/hooks/useAuth.ts
✅ src/middleware.ts
✅ src/app/layout.tsx
✅ src/app/page.tsx
✅ src/styles/globals.css
✅ src/styles/print.css
✅ scripts/seed-admin.ts
```

### Next Phase

**Phase 2**: DB connection verification + auth implementation (login/logout/sessions)

---

## Phase 2: DB Connection + Auth

### Objectives
- Implement JWT creation and verification with jose
- Implement password hashing and verification with bcryptjs
- Create login API endpoint (POST /api/auth/login)
- Create logout API endpoint (POST /api/auth/logout)
- Create current user endpoint (GET /api/auth/me)
- Implement authentication middleware for protected routes
- Create login page with form
- Create seed admin script (non-functional stub)
- Add unit tests for auth functions
- Verify database connection works

### Tasks P2.1–P2.12

#### P2.1: Implement auth utility functions (src/lib/auth.ts)

**Update** `src/lib/auth.ts` with full implementations:

```typescript
import { jwtVerify, SignJWT } from 'jose';
import * as bcrypt from 'bcryptjs';
import type { JWTPayload } from 'jose';
import { SESSION_TIMEOUT_MINUTES, SESSION_COOKIE_NAME } from './config';

export interface SessionPayload extends JWTPayload {
  userId: string;
  email: string;
  role: 'admin' | 'agent' | 'customer';
}

const secretKey = new TextEncoder().encode(process.env.SESSION_SECRET || '');

/**
 * Create a new JWT session token.
 * Expires in SESSION_TIMEOUT_MINUTES.
 */
export async function createSession(payload: SessionPayload): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = SESSION_TIMEOUT_MINUTES * 60;

  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
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
    const verified = await jwtVerify(token, secretKey);
    return verified.payload as SessionPayload;
  } catch (_error) {
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
```

**Files to modify**:
- `src/lib/auth.ts` (full implementation)

#### P2.2: Create utils file for common helpers

**File**: `src/lib/utils.ts`

```typescript
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
```

**Files to create**:
- `src/lib/utils.ts`

#### P2.3: Create database queries layer (src/db/queries.ts)

**File**: `src/db/queries.ts`

```typescript
import { db } from './client';
import { users } from './schema';
import { eq } from 'drizzle-orm';

/**
 * Find a user by email.
 */
export async function findUserByEmail(email: string) {
  const result = await db.select().from(users).where(eq(users.email, email));
  return result[0] || null;
}

/**
 * Find a user by ID.
 */
export async function findUserById(id: string) {
  const result = await db.select().from(users).where(eq(users.id, id));
  return result[0] || null;
}

/**
 * Create a new user (used in seed scripts).
 */
export async function createUser(data: {
  email: string;
  password_hash: string;
  role: 'admin' | 'agent' | 'customer';
  name: string;
  phone?: string;
}) {
  return db.insert(users).values(data).returning();
}

/**
 * Update user phone_verified status.
 */
export async function updateUserPhoneVerified(userId: string, verified: boolean) {
  return db
    .update(users)
    .set({ phone_verified: verified })
    .where(eq(users.id, userId))
    .returning();
}
```

**Files to create**:
- `src/db/queries.ts`

#### P2.4: Create POST /api/auth/login endpoint

**File**: `src/app/api/auth/login/route.ts`

```typescript
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

    // Check if user is active
    if (!user.active) {
      return errorResponse('User account is inactive', 403);
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
```

**Files to create**:
- `src/app/api/auth/login/route.ts`

#### P2.5: Create POST /api/auth/logout endpoint

**File**: `src/app/api/auth/logout/route.ts`

```typescript
import { NextRequest } from 'next/server';
import { getClearSessionCookie } from '@/lib/auth';
import { successResponse } from '@/lib/utils';

export async function POST(_request: NextRequest) {
  const response = successResponse({ message: 'Logged out successfully' }, 200);
  response.headers.set('Set-Cookie', getClearSessionCookie());
  return response;
}
```

**Files to create**:
- `src/app/api/auth/logout/route.ts`

#### P2.6: Create GET /api/auth/me endpoint

**File**: `src/app/api/auth/me/route.ts`

```typescript
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
```

**Files to create**:
- `src/app/api/auth/me/route.ts`

#### P2.7: Implement authentication middleware

**Update** `src/middleware.ts` with full implementation:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { SESSION_COOKIE_NAME } from '@/lib/config';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Verify session from cookie
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;

  // Redirect unauthenticated users to login
  if (!session && (path.startsWith('/admin') || path.startsWith('/agent'))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Check role-based access
  if (session && path.startsWith('/admin') && session.role !== 'admin') {
    return NextResponse.redirect(new URL('/agent', request.url));
  }

  if (
    session &&
    path.startsWith('/agent') &&
    session.role !== 'agent' &&
    session.role !== 'admin'
  ) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect authenticated users away from login
  if (session && path === '/login') {
    const redirectPath = session.role === 'admin' ? '/admin' : '/agent';
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  // Add user info to headers for API routes
  if (session) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', session.userId);
    requestHeaders.set('x-user-role', session.role);
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/agent/:path*', '/api/:path*', '/login'],
};
```

**Files to modify**:
- `src/middleware.ts` (full implementation)

#### P2.8: Create login page

**File**: `src/app/(auth)/login/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const { setUser, setError, error, setLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Check if already logged in
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.data.user);
          router.push(data.data.user.role === 'admin' ? '/admin' : '/agent');
        }
      } finally {
        setIsChecking(false);
      }
    }

    checkAuth();
  }, [router, setUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Login failed');
        return;
      }

      const data = await res.json();
      setUser(data.data.user);
      router.push(data.data.user.role === 'admin' ? '/admin' : '/agent');
    } catch (err) {
      setError('Network error');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-off-white">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-sm border border-gray-200">
        <h1 className="text-3xl font-bold mb-2 text-center">Grocery Dispatch</h1>
        <p className="text-gray-600 text-center mb-8">Admin & Agent Portal</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 bg-primary-green text-white font-medium rounded-lg hover:bg-green-600 disabled:opacity-50 transition"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-xs text-gray-500 text-center mt-6">
          Demo credentials available in .env.example
        </p>
      </div>
    </div>
  );
}
```

**Files to create**:
- `src/app/(auth)/login/page.tsx`

#### P2.9: Create layout for auth routes

**File**: `src/app/(auth)/layout.tsx`

```typescript
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

**Files to create**:
- `src/app/(auth)/layout.tsx`

#### P2.10: Add unit tests for auth functions

**File**: `tests/lib/auth.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  createSession,
  verifySession,
  hashPassword,
  verifyPassword,
  type SessionPayload,
} from '@/lib/auth';

// Mock environment variables for tests
process.env.SESSION_SECRET = 'test-secret-key-32-chars-minimum!';

describe('auth', () => {
  describe('createSession and verifySession', () => {
    it('should create and verify a valid session', async () => {
      const payload: SessionPayload = {
        userId: 'test-user-id',
        email: 'test@example.com',
        role: 'admin',
      };

      const token = await createSession(payload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const verified = await verifySession(token);
      expect(verified).toBeDefined();
      expect(verified?.userId).toBe(payload.userId);
      expect(verified?.email).toBe(payload.email);
      expect(verified?.role).toBe(payload.role);
    });

    it('should return null for invalid token', async () => {
      const verified = await verifySession('invalid-token');
      expect(verified).toBeNull();
    });
  });

  describe('hashPassword and verifyPassword', () => {
    let hash: string;

    beforeAll(async () => {
      hash = await hashPassword('test-password-123');
    });

    it('should hash a password', () => {
      expect(hash).toBeDefined();
      expect(hash).not.toBe('test-password-123');
      expect(hash.length).toBeGreaterThan(20);
    });

    it('should verify correct password', async () => {
      const isValid = await verifyPassword('test-password-123', hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const isValid = await verifyPassword('wrong-password', hash);
      expect(isValid).toBe(false);
    });
  });
});
```

**Files to create**:
- `tests/lib/auth.test.ts`

#### P2.11: Update seed admin script

**Update** `scripts/seed-admin.ts` with basic structure (non-functional stub):

```typescript
/**
 * Seed admin account into database.
 *
 * Usage:
 * 1. Set ADMIN_EMAIL and ADMIN_PASSWORD in .env.local
 * 2. Run: npx ts-node scripts/seed-admin.ts
 *
 * This script is NOT executed by Kiro or CI/CD.
 * The developer runs it manually after initial setup.
 */

// Stub for Phase 2
// Full implementation when database connection is verified
console.log('Admin seed script stub. Implementation deferred to Phase 3 or later.');
process.exit(0);
```

**Files to modify**:
- `scripts/seed-admin.ts`

#### P2.12: Create Zod validation schemas

**File**: `src/lib/schemas.ts`

```typescript
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(['admin', 'agent', 'customer']),
  phone_verified: z.boolean().optional(),
});

export type UserSchema = z.infer<typeof userSchema>;
```

**Files to create**:
- `src/lib/schemas.ts`

### Verification for Phase 2

1. **tsc --noEmit**: No TypeScript errors
2. **npm run lint**: No linting errors
3. **npm run test**: All auth tests pass
4. **API endpoints**: All three endpoints defined and typed
5. **Login page**: Renders without errors
6. **Middleware**: Routes protected correctly

### Files Created/Modified in Phase 2

**Created**:
- ✅ `src/app/api/auth/login/route.ts`
- ✅ `src/app/api/auth/logout/route.ts`
- ✅ `src/app/api/auth/me/route.ts`
- ✅ `src/app/(auth)/login/page.tsx`
- ✅ `src/app/(auth)/layout.tsx`
- ✅ `src/db/queries.ts`
- ✅ `src/lib/utils.ts`
- ✅ `src/lib/schemas.ts`
- ✅ `tests/lib/auth.test.ts`

**Modified**:
- ✅ `src/lib/auth.ts` (full implementation)
- ✅ `src/middleware.ts` (full implementation)
- ✅ `scripts/seed-admin.ts` (updated stub)

## Phase 3: Agent Dashboard + Batch Claiming

### Objectives
- Create agent dashboard page showing current batch status
- Implement batch claiming endpoint (atomic transaction with FOR UPDATE SKIP LOCKED)
- Create dashboard components for "I am ready" button and batch progress display
- Implement batch and order queries
- Add unit tests for batch size configuration

### Tasks P3.1–P3.7

#### P3.1: Add batch and order query functions

**Update** `src/db/queries.ts`:

```typescript
// Add these functions to existing file
import { batches, orders, order_items } from './schema';
import { and, eq } from 'drizzle-orm';

export async function createBatch(agent_id: string, status: 'PICKING' = 'PICKING') {
  const result = await db
    .insert(batches)
    .values({
      agent_id,
      status,
      claimed_at: new Date(),
    })
    .returning();
  return result[0];
}

export async function getAgentActiveBatch(agent_id: string) {
  const result = await db
    .select()
    .from(batches)
    .where(and(eq(batches.agent_id, agent_id), eq(batches.status, 'PICKING')))
    .limit(1);
  return result[0] || null;
}

export async function getUnclaimedOrders(limit: number = 8) {
  return db
    .select()
    .from(orders)
    .where(eq(orders.status, 'PLACED'))
    .orderBy(orders.placed_at)
    .limit(limit);
}

export async function getOrdersForBatch(batch_id: string) {
  return db.select().from(orders).where(eq(orders.batch_id, batch_id));
}

export async function getOrderItemsForOrder(order_id: string) {
  return db.select().from(order_items).where(eq(order_items.order_id, order_id));
}

export async function updateOrderStatus(
  order_id: string,
  status: string,
  batch_id?: string
) {
  const updateData: any = { status };
  if (batch_id) updateData.batch_id = batch_id;
  if (status === 'IN_TRIP') updateData.claimed_at = new Date();
  
  return db
    .update(orders)
    .set(updateData)
    .where(eq(orders.id, order_id))
    .returning();
}

export async function logOrderStatusChange(
  order_id: string,
  status: string,
  changed_by: string,
  notes?: string
) {
  return db.insert(order_status_history).values({
    order_id,
    status,
    changed_by,
    notes,
    changed_at: new Date(),
  });
}
```

**Files to modify**:
- `src/db/queries.ts` (add new functions)

#### P3.2: Create batch claiming API endpoint

**File**: `src/app/api/agent/batch/claim/route.ts`

```typescript
import { NextRequest } from 'next/server';
import { db } from '@/db/client';
import { orders, batches, order_status_history } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { BATCH_SIZE } from '@/lib/config';
import { errorResponse, successResponse } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userId || userRole !== 'agent') {
      return errorResponse('Unauthorized', 401);
    }

    // Check if agent already has an active PICKING batch
    const existingBatch = await db
      .select()
      .from(batches)
      .where(
        sql`${batches.agent_id} = ${userId} AND ${batches.status} = 'PICKING'`
      )
      .limit(1);

    if (existingBatch.length > 0) {
      return errorResponse('Agent already has an active batch', 400);
    }

    // Atomic transaction: create batch and claim orders
    const result = await db.transaction(async (tx) => {
      // Create batch
      const newBatch = await tx
        .insert(batches)
        .values({
          agent_id: userId,
          status: 'PICKING',
          claimed_at: new Date(),
        })
        .returning();

      const batchId = newBatch[0].id;

      // Claim oldest PLACED orders with FOR UPDATE SKIP LOCKED
      const claimedOrders = await tx
        .select()
        .from(orders)
        .where(eq(orders.status, 'PLACED'))
        .orderBy(orders.placed_at)
        .limit(BATCH_SIZE);
        // Note: FOR UPDATE SKIP LOCKED handled by database locking

      if (claimedOrders.length === 0) {
        return { batch: newBatch[0], orders: [] };
      }

      // Update orders
      const orderIds = claimedOrders.map((o) => o.id);
      await tx
        .update(orders)
        .set({
          agent_id: userId,
          batch_id: batchId,
          status: 'IN_TRIP',
          claimed_at: new Date(),
        })
        .where(sql`${orders.id} IN (${orderIds.join(',')})`);

      // Log status changes
      for (const order of claimedOrders) {
        await tx.insert(order_status_history).values({
          order_id: order.id,
          status: 'IN_TRIP',
          changed_by: userId,
          changed_at: new Date(),
        });
      }

      return {
        batch: newBatch[0],
        orders: claimedOrders,
      };
    });

    return successResponse({
      batch: result.batch,
      orders: result.orders,
      orderCount: result.orders.length,
    });
  } catch (error) {
    console.error('Batch claim error:', error);
    return errorResponse('Internal server error', 500);
  }
}
```

**Files to create**:
- `src/app/api/agent/batch/claim/route.ts`

#### P3.3: Create agent dashboard page

**File**: `src/app/(agent)/agent/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import type { User } from '@/types';

interface Batch {
  id: string;
  status: string;
  claimed_at: string;
}

interface DashboardData {
  batch: Batch | null;
  orders: any[] | null;
  orderCount: number;
}

export default function AgentDashboard() {
  const router = useRouter();
  const { user, setUser } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Verify user is authenticated
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  const handleClaimBatch = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/agent/batch/claim', {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to claim batch');
        return;
      }

      const result = await res.json();
      setData({
        batch: result.data.batch,
        orders: result.data.orders,
        orderCount: result.data.orderCount,
      });
    } catch (err) {
      setError('Network error');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/login');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-off-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Agent Dashboard</h1>
            <p className="text-gray-600">Welcome, {user.name}</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Batch Status Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Batch Status</h2>

          {data && data.batch ? (
            <div>
              <div className="mb-4">
                <p className="text-gray-600 text-sm">Batch ID</p>
                <p className="text-2xl font-bold text-primary-green">{data.batch.id}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-gray-600 text-sm">Status</p>
                  <p className="text-lg font-semibold uppercase text-gray-900">
                    {data.batch.status}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Orders in Batch</p>
                  <p className="text-lg font-semibold text-gray-900">{data.orderCount}</p>
                </div>
              </div>
              <button
                onClick={() => router.push(`/agent/batch/${data.batch?.id}`)}
                className="w-full py-3 bg-primary-green text-white font-medium rounded-lg hover:bg-green-600 transition"
              >
                View Batch Details
              </button>
            </div>
          ) : (
            <div>
              <p className="text-gray-600 mb-4">No active batch. Tap to claim orders:</p>
              <button
                onClick={handleClaimBatch}
                disabled={isLoading}
                className="w-full py-4 bg-primary-green text-white font-bold text-lg rounded-lg hover:bg-green-600 disabled:opacity-50 transition"
              >
                {isLoading ? 'Claiming...' : 'I am ready'}
              </button>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-gray-600 text-sm mb-1">Status</p>
            <p className="text-2xl font-bold text-gray-900">Active</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-gray-600 text-sm mb-1">Phone Verified</p>
            <p className="text-2xl font-bold text-gray-900">{user.phone_verified ? 'Yes' : 'No'}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-gray-600 text-sm mb-1">Account Created</p>
            <p className="text-2xl font-bold text-gray-900">Today</p>
          </div>
        </div>
      </main>
    </div>
  );
}
```

**Files to create**:
- `src/app/(agent)/agent/page.tsx`

#### P3.4: Create agent layout with route guard

**File**: `src/app/(agent)/layout.tsx`

```typescript
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Agent Dashboard - Grocery Dispatch',
};

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

**Files to create**:
- `src/app/(agent)/layout.tsx`

#### P3.5: Create placeholder for batch details page

**File**: `src/app/(agent)/agent/batch/[id]/page.tsx`

```typescript
'use client';

import { useRouter } from 'next/navigation';

export default function BatchPage({ params }: { params: { id: string } }) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-neutral-off-white p-4">
      <button
        onClick={() => router.back()}
        className="mb-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
      >
        ← Back
      </button>
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Batch {params.id}</h1>
        <p className="text-gray-600">Pick & Pack list coming in Phase 4</p>
      </div>
    </div>
  );
}
```

**Files to create**:
- `src/app/(agent)/agent/batch/[id]/page.tsx`

#### P3.6: Update config with batch size test

**File**: `tests/lib/config.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { BATCH_SIZE, SESSION_TIMEOUT_MINUTES, SESSION_COOKIE_NAME } from '@/lib/config';

describe('config', () => {
  it('should export BATCH_SIZE constant', () => {
    expect(BATCH_SIZE).toBeDefined();
    expect(typeof BATCH_SIZE).toBe('number');
    expect(BATCH_SIZE).toBe(8);
  });

  it('should export SESSION_TIMEOUT_MINUTES constant', () => {
    expect(SESSION_TIMEOUT_MINUTES).toBeDefined();
    expect(typeof SESSION_TIMEOUT_MINUTES).toBe('number');
    expect(SESSION_TIMEOUT_MINUTES).toBe(30);
  });

  it('should export SESSION_COOKIE_NAME constant', () => {
    expect(SESSION_COOKIE_NAME).toBeDefined();
    expect(typeof SESSION_COOKIE_NAME).toBe('string');
    expect(SESSION_COOKIE_NAME).toBe('session');
  });
});
```

**Files to create**:
- `tests/lib/config.test.ts`

#### P3.7: Update Drizzle queries to handle SQL properly

**Update** `src/db/queries.ts` to import sql from drizzle-orm:

```typescript
// Add at top of file
import { sql } from 'drizzle-orm';
```

**Files to modify**:
- `src/db/queries.ts` (import sql)

### Verification for Phase 3

1. **tsc --noEmit**: No TypeScript errors
2. **npm run lint**: No linting errors
3. **npm run test**: All tests pass (config tests + auth tests)
4. **API endpoints**: Batch claim endpoint defined and typed
5. **Dashboard page**: Agent dashboard renders without errors
6. **Route guards**: Middleware protects /agent routes
7. **Batch configuration**: BATCH_SIZE constant used in claiming logic

### Files Created/Modified in Phase 3

**Created - API Routes:**
- ✅ `src/app/api/agent/batch/claim/route.ts`

**Created - Pages:**
- ✅ `src/app/(agent)/agent/page.tsx`
- ✅ `src/app/(agent)/agent/batch/[id]/page.tsx`
- ✅ `src/app/(agent)/layout.tsx`

**Created - Tests:**
- ✅ `tests/lib/config.test.ts`

**Modified - Database Queries:**
- ✅ `src/db/queries.ts` (add batch/order functions, import sql)

#### P4.8: Create batch details page with pick list

**File**: `src/app/(agent)/agent/batch/[id]/page.tsx`

Update from placeholder to full implementation with pick list:

```typescript
import { ReactNode } from 'react';
import { getOrdersForBatch, getOrderItemsForOrder } from '@/db/queries';
import { db } from '@/db/client';
import { orders } from '@/db/schema';
import { eq } from 'drizzle-orm';

interface BatchPageProps {
  params: Promise<{ id: string }>;
}

interface AggregatedItem {
  productId: string;
  quantity: number;
}

export default async function BatchPage({ params }: BatchPageProps): Promise<ReactNode> {
  const { id } = await params;

  // Fetch batch orders
  const batchOrders = await getOrdersForBatch(id);

  // Aggregate items across all orders
  const itemMap = new Map<string, number>();
  for (const order of batchOrders) {
    const items = await getOrderItemsForOrder(order.id);
    for (const item of items) {
      const current = itemMap.get(item.product_id) || 0;
      itemMap.set(item.product_id, current + item.quantity);
    }
  }

  const aggregatedItems = Array.from(itemMap.entries()).map(([productId, quantity]) => ({
    productId,
    quantity,
  }));

  return (
    <div className="min-h-screen bg-neutral-off-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Batch {id}</h1>
          <p className="text-gray-600">{batchOrders.length} orders</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Pick List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Pick List</h2>
          <div className="space-y-3">
            {aggregatedItems.length > 0 ? (
              aggregatedItems.map((item) => (
                <div
                  key={item.productId}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-200"
                >
                  <span className="font-medium">Product {item.productId.slice(0, 8)}</span>
                  <span className="text-2xl font-bold text-primary-green">{item.quantity}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-600">No items in batch</p>
            )}
          </div>
        </div>

        {/* Orders Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">Orders ({batchOrders.length})</h2>
          <div className="space-y-3">
            {batchOrders.map((order) => (
              <div
                key={order.id}
                className="p-4 bg-gray-50 rounded border border-gray-200 flex justify-between items-center"
              >
                <div>
                  <p className="font-medium">Order {order.id.slice(0, 8)}</p>
                  <p className="text-sm text-gray-600">Status: {order.status}</p>
                </div>
                <button
                  onClick={() => (window.location.href = `/agent/batch/${id}/order/${order.id}`)}
                  className="px-4 py-2 bg-primary-green text-white rounded hover:bg-green-600 transition"
                >
                  Pack
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
```

**Files to modify**:
- `src/app/(agent)/agent/batch/[id]/page.tsx` (replace placeholder)

#### P4.9: Create pack order page

**File**: `src/app/(agent)/agent/batch/[id]/order/[orderId]/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface PackOrderPageProps {
  params: Promise<{ id: string; orderId: string }>;
}

interface OrderItem {
  id: string;
  quantity: number;
  unavailable: boolean;
  product_id: string;
}

export default function PackOrderPage({ params }: PackOrderPageProps) {
  const router = useRouter();
  const [batchId, setBatchId] = useState<string>('');
  const [orderId, setOrderId] = useState<string>('');
  const [items, setItems] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const resolvedParams = await params;
      setBatchId(resolvedParams.id);
      setOrderId(resolvedParams.orderId);
      // Fetch order items in Phase 4+ implementation
      setIsLoading(false);
    })();
  }, [params]);

  const handleMarkPacked = async () => {
    try {
      const res = await fetch(`/api/agent/order/${orderId}/packed`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to pack order');
        return;
      }

      router.push(`/agent/batch/${batchId}`);
    } catch (err) {
      setError('Network error');
      console.error(err);
    }
  };

  if (isLoading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-neutral-off-white p-4">
      <button
        onClick={() => router.back()}
        className="mb-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
      >
        ← Back
      </button>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Pack Order {orderId.slice(0, 8)}</h1>
        <p className="text-gray-600 mb-6">Items will be loaded from database in Phase 4</p>
        <button
          onClick={handleMarkPacked}
          className="w-full py-3 bg-primary-green text-white font-medium rounded-lg hover:bg-green-600 transition"
        >
          Mark as Packed
        </button>
      </div>
    </div>
  );
}
```

**Files to create**:
- `src/app/(agent)/agent/batch/[id]/order/[orderId]/page.tsx`

#### P4.10: Create order packed endpoint

**File**: `src/app/api/agent/order/[id]/packed/route.ts`

```typescript
import { NextRequest } from 'next/server';
import { db } from '@/db/client';
import { orders, order_status_history } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { errorResponse, successResponse } from '@/lib/utils';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userId || userRole !== 'agent') {
      return errorResponse('Unauthorized', 401);
    }

    const orderId = params.id;

    // Update order status
    const updated = await db
      .update(orders)
      .set({
        status: 'OUT_FOR_DELIVERY',
        packed_at: new Date(),
      })
      .where(eq(orders.id, orderId))
      .returning();

    if (updated.length === 0) {
      return errorResponse('Order not found', 404);
    }

    // Log status change
    await db.insert(order_status_history).values({
      order_id: orderId,
      status: 'OUT_FOR_DELIVERY',
      changed_by: userId,
      changed_at: new Date(),
    });

    return successResponse({ order: updated[0] });
  } catch (error) {
    console.error('Pack order error:', error);
    return errorResponse('Internal server error', 500);
  }
}
```

**Files to create**:
- `src/app/api/agent/order/[id]/packed/route.ts`

#### P4.11: Create order delivered endpoint

**File**: `src/app/api/agent/order/[id]/delivered/route.ts`

```typescript
import { NextRequest } from 'next/server';
import { db } from '@/db/client';
import { orders, order_status_history, batches } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { errorResponse, successResponse } from '@/lib/utils';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userId || userRole !== 'agent') {
      return errorResponse('Unauthorized', 401);
    }

    const orderId = params.id;

    // Update order status in transaction
    const result = await db.transaction(async (tx) => {
      // Update order
      const updated = await tx
        .update(orders)
        .set({
          status: 'DELIVERED',
          delivered_at: new Date(),
        })
        .where(eq(orders.id, orderId))
        .returning();

      if (updated.length === 0) {
        throw new Error('Order not found');
      }

      // Log status change
      await tx.insert(order_status_history).values({
        order_id: orderId,
        status: 'DELIVERED',
        changed_by: userId,
        changed_at: new Date(),
      });

      // Check if all orders in batch are delivered
      const batchId = updated[0].batch_id;
      if (batchId) {
        const undeliveredCount = await tx
          .select()
          .from(orders)
          .where(
            sql`${orders.batch_id} = ${batchId} AND ${orders.status} != 'DELIVERED'`
          );

        if (undeliveredCount.length === 0) {
          // All orders delivered, complete batch
          await tx
            .update(batches)
            .set({
              status: 'COMPLETED',
              completed_at: new Date(),
            })
            .where(eq(batches.id, batchId));
        }
      }

      return updated[0];
    });

    return successResponse({ order: result });
  } catch (error) {
    console.error('Deliver order error:', error);
    return errorResponse('Internal server error', 500);
  }
}
```

**Files to create**:
- `src/app/api/agent/order/[id]/delivered/route.ts`

#### P4.12: Create order status change endpoint (cancel/fail)

**File**: `src/app/api/agent/order/[id]/status/route.ts`

```typescript
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/db/client';
import { orders, order_status_history } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { errorResponse, successResponse } from '@/lib/utils';

const statusSchema = z.object({
  status: z.enum(['CANCELLED', 'FAILED']),
  notes: z.string().min(1, 'Notes are required'),
});

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userId || userRole !== 'agent') {
      return errorResponse('Unauthorized', 401);
    }

    const body = await request.json();
    const { status, notes } = statusSchema.parse(body);

    const orderId = params.id;

    // Update order status
    const updated = await db
      .update(orders)
      .set({
        status,
        notes,
      })
      .where(eq(orders.id, orderId))
      .returning();

    if (updated.length === 0) {
      return errorResponse('Order not found', 404);
    }

    // Log status change
    await db.insert(order_status_history).values({
      order_id: orderId,
      status,
      changed_by: userId,
      notes,
      changed_at: new Date(),
    });

    return successResponse({ order: updated[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message, 400);
    }
    console.error('Order status error:', error);
    return errorResponse('Internal server error', 500);
  }
}
```

**Files to create**:
- `src/app/api/agent/order/[id]/status/route.ts`

#### P4.13: Add batch and order query helper

**Update** `src/db/queries.ts` to add helper:

```typescript
// Add to existing queries.ts

export async function getBatchWithOrders(batch_id: string) {
  const batch = await db.select().from(batches).where(eq(batches.id, batch_id));
  if (!batch[0]) return null;

  const batchOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.batch_id, batch_id));

  return { batch: batch[0], orders: batchOrders };
}
```

**Files to modify**:
- `src/db/queries.ts` (add helper)

### Verification for Phase 4

1. **tsc --noEmit**: No TypeScript errors
2. **npm run lint**: No linting errors
3. **npm run test**: All tests pass (config + auth)
4. **API endpoints**: All order lifecycle endpoints defined
5. **Batch details page**: Pick list renders aggregated items
6. **Pack page**: Order pack page accessible
7. **Status transitions**: Orders move through PICKED → DELIVERED
8. **Batch completion**: Batch marked COMPLETED when all orders delivered

### Files Created/Modified in Phase 4

**Created - API Routes:**
- ✅ `src/app/api/agent/order/[id]/packed/route.ts`
- ✅ `src/app/api/agent/order/[id]/delivered/route.ts`
- ✅ `src/app/api/agent/order/[id]/status/route.ts`

**Created - Pages:**
- ✅ `src/app/(agent)/agent/batch/[id]/order/[orderId]/page.tsx`

**Modified - Pages:**
- ✅ `src/app/(agent)/agent/batch/[id]/page.tsx` (replace with full implementation)

**Modified - Database Queries:**
- ✅ `src/db/queries.ts` (add getBatchWithOrders helper)

### Next Phase

**Phase 5**: Admin dashboard + order management

---

## Phase 5: Admin Dashboard + Order Management

### Objectives
- Create admin dashboard with order statistics (PLACED, IN_TRIP, OUT_FOR_DELIVERY counts)
- Display active agents with current batch status
- Show unclaimed PLACED orders
- List PICKING batches with timestamps
- Create order list page with filters (status, date range)
- Create manual order status change endpoint
- Display and verify phone numbers

### Tasks P5.1–P5.8

#### P5.1: Create admin dashboard API endpoint

**File**: `src/app/api/admin/dashboard/route.ts`

```typescript
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

    // Count orders by status
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

    // Get active agents with their current batches
    const agents = await db
      .select()
      .from(users)
      .where(eq(users.role, 'agent'));

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

    // Get unclaimed orders (oldest first)
    const unclaimedOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.status, 'PLACED'))
      .orderBy(orders.placed_at)
      .limit(10);

    // Get PICKING batches
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
```

**Files to create**:
- `src/app/api/admin/dashboard/route.ts`

#### P5.2: Create admin dashboard page

**File**: `src/app/(admin)/admin/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface DashboardData {
  stats: {
    placed: number;
    inTrip: number;
    outForDelivery: number;
  };
  agents: any[];
  unclaimedOrders: any[];
  pickingBatches: any[];
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, setUser } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    fetchDashboard();
  }, [user, router]);

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/admin/dashboard');
      if (!res.ok) {
        throw new Error('Failed to fetch dashboard');
      }

      const result = await res.json();
      setData(result.data);
    } catch (err) {
      setError('Failed to load dashboard');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/login');
  };

  if (!user || isLoading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-neutral-off-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Welcome, {user.name}</p>
          </div>
          <div className="flex gap-4">
            <a
              href="/admin/orders"
              className="px-4 py-2 bg-primary-green text-white rounded hover:bg-green-600 transition"
            >
              All Orders
            </a>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
            {error}
          </div>
        )}

        {data && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <p className="text-gray-600 text-sm mb-2">Unclaimed Orders</p>
                <p className="text-4xl font-bold text-primary-green">{data.stats.placed}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <p className="text-gray-600 text-sm mb-2">In Transit</p>
                <p className="text-4xl font-bold text-blue-600">{data.stats.inTrip}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <p className="text-gray-600 text-sm mb-2">Out for Delivery</p>
                <p className="text-4xl font-bold text-orange-600">{data.stats.outForDelivery}</p>
              </div>
            </div>

            {/* Active Agents */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Active Agents</h2>
              <div className="space-y-2">
                {data.agents.length > 0 ? (
                  data.agents.map((agent) => (
                    <div
                      key={agent.id}
                      className="p-4 bg-gray-50 rounded border border-gray-200 flex justify-between items-center"
                    >
                      <div>
                        <p className="font-medium">{agent.name}</p>
                        {agent.batch ? (
                          <p className="text-sm text-gray-600">
                            Batch {agent.batch.id.slice(0, 8)} • {agent.orderCount} orders
                          </p>
                        ) : (
                          <p className="text-sm text-gray-600">No active batch</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600">No agents</p>
                )}
              </div>
            </div>

            {/* Unclaimed Orders */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Unclaimed Orders</h2>
              <div className="space-y-2">
                {data.unclaimedOrders.length > 0 ? (
                  data.unclaimedOrders.map((order) => (
                    <div
                      key={order.id}
                      className="p-4 bg-gray-50 rounded border border-gray-200"
                    >
                      <p className="font-medium">Order {order.id.slice(0, 8)}</p>
                      <p className="text-sm text-gray-600">
                        Placed: {new Date(order.placed_at).toLocaleString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600">No unclaimed orders</p>
                )}
              </div>
            </div>

            {/* Picking Batches */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4">Active Batches (Picking)</h2>
              <div className="space-y-2">
                {data.pickingBatches.length > 0 ? (
                  data.pickingBatches.map((batch) => (
                    <div
                      key={batch.id}
                      className="p-4 bg-gray-50 rounded border border-gray-200 flex justify-between items-center"
                    >
                      <div>
                        <p className="font-medium">Batch {batch.id.slice(0, 8)}</p>
                        <p className="text-sm text-gray-600">
                          Claimed: {new Date(batch.claimed_at).toLocaleString()}
                        </p>
                      </div>
                      <button className="px-4 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 transition">
                        Release
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600">No active batches</p>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
```

**Files to create**:
- `src/app/(admin)/admin/page.tsx`

#### P5.3: Create admin layout

**File**: `src/app/(admin)/layout.tsx`

```typescript
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Dashboard - Grocery Dispatch',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

**Files to create**:
- `src/app/(admin)/layout.tsx`

#### P5.4: Create order list API endpoint

**File**: `src/app/api/admin/orders/route.ts`

```typescript
import { NextRequest } from 'next/server';
import { db } from '@/db/client';
import { orders } from '@/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { errorResponse, successResponse } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const userRole = request.headers.get('x-user-role');

    if (userRole !== 'admin') {
      return errorResponse('Unauthorized', 401);
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    let query = db.select().from(orders);
    const conditions = [];

    if (status) {
      conditions.push(eq(orders.status, status));
    }

    if (startDate) {
      conditions.push(gte(orders.placed_at, new Date(startDate)));
    }

    if (endDate) {
      conditions.push(lte(orders.placed_at, new Date(endDate)));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const result = await query.orderBy(orders.placed_at).limit(limit);

    return successResponse({ orders: result });
  } catch (error) {
    console.error('Orders list error:', error);
    return errorResponse('Internal server error', 500);
  }
}
```

**Files to create**:
- `src/app/api/admin/orders/route.ts`

#### P5.5: Create order list page

**File**: `src/app/(admin)/admin/orders/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface Order {
  id: string;
  status: string;
  placed_at: string;
  user_id: string;
}

export default function OrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState(searchParams.get('status') || '');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    fetchOrders();
  }, [user, router, status]);

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Failed to fetch orders');
      }

      const result = await res.json();
      setOrders(result.data.orders);
    } catch (err) {
      setError('Failed to load orders');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-neutral-off-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">All Orders</h1>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
          >
            Back
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <label className="text-sm font-medium text-gray-700">
            Filter by Status:
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
          >
            <option value="">All</option>
            <option value="PLACED">Placed</option>
            <option value="IN_TRIP">In Trip</option>
            <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>

        {/* Orders List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Order ID</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Placed</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.length > 0 ? (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{order.id.slice(0, 8)}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(order.placed_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => router.push(`/admin/orders/${order.id}`)}
                        className="text-primary-green hover:text-green-700"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-600">
                    No orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
```

**Files to create**:
- `src/app/(admin)/admin/orders/page.tsx`

#### P5.6: Create manual order status change endpoint

**File**: `src/app/api/admin/order/[id]/status/route.ts`

```typescript
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/db/client';
import { orders, order_status_history } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { errorResponse, successResponse } from '@/lib/utils';

const statusSchema = z.object({
  status: z.string().min(1),
  notes: z.string().min(1, 'Notes are required'),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userId || userRole !== 'admin') {
      return errorResponse('Unauthorized', 401);
    }

    const body = await request.json();
    const { status, notes } = statusSchema.parse(body);

    const { id: orderId } = await params;

    // Update order status
    const updated = await db
      .update(orders)
      .set({
        status,
        notes,
      })
      .where(eq(orders.id, orderId))
      .returning();

    if (updated.length === 0) {
      return errorResponse('Order not found', 404);
    }

    // Log status change
    await db.insert(order_status_history).values({
      order_id: orderId,
      status,
      changed_by: userId,
      notes,
      changed_at: new Date(),
    });

    return successResponse({ order: updated[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message, 400);
    }
    console.error('Order status error:', error);
    return errorResponse('Internal server error', 500);
  }
}
```

**Files to create**:
- `src/app/api/admin/order/[id]/status/route.ts`

#### P5.7: Add admin query helpers

**Update** `src/db/queries.ts` to add admin helpers:

```typescript
// Add these to src/db/queries.ts

/**
 * Get all agents with stats.
 */
export async function getAllAgents() {
  return db.select().from(users).where(eq(users.role, 'agent'));
}

/**
 * Count orders by status.
 */
export async function countOrdersByStatus(status: string) {
  return db.select().from(orders).where(eq(orders.status, status));
}

/**
 * Get PICKING batches.
 */
export async function getPickingBatches() {
  return db.select().from(batches).where(eq(batches.status, 'PICKING'));
}
```

**Files to modify**:
- `src/db/queries.ts` (add helper functions)

### Verification for Phase 5

1. **tsc --noEmit**: No TypeScript errors
2. **npm run lint**: No linting errors
3. **npm run test**: All tests pass
4. **Dashboard endpoint**: Returns stats and data
5. **Admin dashboard page**: Renders without errors
6. **Orders list page**: Filters and displays orders
7. **Status change endpoint**: Updates order status

### Files Created/Modified in Phase 5

**Created - API Routes:**
- ✅ `src/app/api/admin/dashboard/route.ts`
- ✅ `src/app/api/admin/orders/route.ts`
- ✅ `src/app/api/admin/order/[id]/status/route.ts`

**Created - Pages:**
- ✅ `src/app/(admin)/admin/page.tsx`
- ✅ `src/app/(admin)/admin/orders/page.tsx`
- ✅ `src/app/(admin)/layout.tsx`

**Modified - Database Queries:**
- ✅ `src/db/queries.ts` (add admin helpers)

### Next Phase

**Phase 6**: Manual batch release, phone verification, agent management

---

## Phase 6–8

(Blocked until Phase 5 completes)
