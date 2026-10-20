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
