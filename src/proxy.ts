import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/auth/session';

/**
 * Map role from session to allowed portal path prefixes.
 * Updated to match backend proto enum.
 */
export function getAllowedPortals(role?: string): string[] {
  if (!role) return ['/admin', '/sale', '/tech'];
  const r = role.toUpperCase();
  
  // USER_ROLE_ADMIN = 8
  if (r.includes('ADMIN') || r === '8') {
    return ['/admin', '/sale', '/tech'];
  }
  // USER_ROLE_SALE = 5
  if (r.includes('SALE') || r === '5') {
    return ['/sale'];
  }
  // USER_ROLE_TECH_SOFTWARE = 6, USER_ROLE_TECH_HARDWARE = 7
  if (r.includes('TECH') || r === '6' || r === '7') {
    return ['/tech'];
  }
  // USER_ROLE_MANAGER = 3, USER_ROLE_MEMBER = 4, USER_ROLE_ORG_ADMIN = 2
  if (r === '2' || r === '3' || r === '4' || r.includes('MANAGER') || r.includes('MEMBER')) {
    return ['/admin'];
  }
  return [];
}

export function getRoleDashboard(role?: string): string {
  if (!role) return '/admin/dashboard';
  const r = role.toUpperCase();
  if (r.includes('ADMIN') || r === '8') return '/admin/dashboard';
  if (r.includes('SALE') || r === '5') return '/sale/dashboard';
  if (r.includes('TECH') || r === '6' || r === '7') return '/tech/dashboard';
  if (r === '2' || r === '3' || r === '4') return '/admin/dashboard';
  return '/';
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define public paths that don't require authentication
  const publicPaths = [
    '/login',
    '/register',
    '/verify-email',
    '/forgot-password',
    '/reset-password',
    '/api/auth/forgot',
    '/api/auth/reset',
    '/api/auth/refresh',
    '/api/auth/login',
  ];
  
  // Check if current path is public or is a static asset/image
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));
  const isStaticAsset = pathname.includes('.') || pathname.startsWith('/_next');

  if (isPublicPath || isStaticAsset) {
    return NextResponse.next();
  }

  // Verify session
  const cookie = request.cookies.get('itms_session')?.value;
  const session = await decrypt(cookie);

  // If no valid session
  if (!session?.userId) {
    // For API routes, return JSON 401
    if (pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // For page navigation, redirect to login
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Role-based portal access control (permissive: all authenticated users can access all portals)
  // Fine-grained role checks are handled client-side per portal
  // const role = session.role as string | undefined;

  // User is authenticated, inject user info into headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', session.userId as string);
  requestHeaders.set('x-user-email', session.email as string);
  if (session.role) {
    requestHeaders.set('x-user-role', session.role as string);
  }
  if (session.customerId) {
    requestHeaders.set('x-customer-id', session.customerId as string);
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
