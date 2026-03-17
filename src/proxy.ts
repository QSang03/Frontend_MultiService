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
  
  // USER_ROLE_CUSTOMER = 1
  if (r.includes('CUSTOMER') || r === '1') {
    return ['/customer/b2c'];
  }
  // USER_ROLE_ORG_ADMIN = 2
  if (r.includes('ORG_ADMIN') || r === '2') {
    return ['/customer/b2b'];
  }
  // USER_ROLE_MEMBER = 4
  if (r.includes('MEMBER') || r === '4') {
    return ['/customer/b2b'];
  }
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
  // USER_ROLE_MANAGER = 3
  if (r === '3' || r.includes('MANAGER')) {
    return ['/admin'];
  }
  return [];
}

export function getRoleDashboard(role?: string): string {
  if (!role) return '/admin/dashboard';
  const r = role.toUpperCase();
  if (r.includes('CUSTOMER') || r === '1') return '/customer/b2c/dashboard';
  if (r.includes('ORG_ADMIN') || r === '2') return '/customer/b2b/dashboard';
  if (r.includes('MEMBER') || r === '4') return '/customer/b2b/dashboard';
  if (r.includes('ADMIN') || r === '8') return '/admin/dashboard';
  if (r.includes('SALE') || r === '5') return '/sale/dashboard';
  if (r.includes('TECH') || r === '6' || r === '7') return '/tech/dashboard';
  if (r === '3' || r.includes('MANAGER')) return '/admin/dashboard';
  return '/';
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define public paths that don't require authentication
  const publicPaths = [
    '/',
    '/login',
    '/register',
    '/verify-email',
    '/forgot-password',
    '/reset-password',
    '/api/auth/forgot',
    '/api/auth/reset',
    '/api/auth/refresh',
    '/api/auth/login',
    '/api/sale/crm/create-guest',
    '/api/sale/crm/send-account-otp',
    '/api/sale/crm/verify-account-otp',
    '/api/sale/crm/convert-guest-to-customer',
    '/api/sale/tickets',
    '/api/admin/catalog/categories',
  ];
  
  // Check if current path is public or is a static asset/image
  const isPublicPath = pathname === '/' || publicPaths.some(path => path !== '/' && pathname.startsWith(path));
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
