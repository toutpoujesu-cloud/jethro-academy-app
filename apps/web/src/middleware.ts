import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication
const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-certificate',
  '/accept-invite',
  '/api',
];

// Auth routes — redirect to dashboard if already logged in
const AUTH_ONLY_PATHS = ['/login', '/register'];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isAuthOnly(pathname: string): boolean {
  return AUTH_ONLY_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Read auth state from cookie set by the client store (see auth.store.ts)
  // We use a lightweight "jethro_auth_check" cookie (value = "1" when logged in)
  // The real JWT lives in localStorage — can't read that in middleware.
  // The cookie is set/cleared by login/logout in the Zustand store.
  const isLoggedIn = request.cookies.has('jethro_auth_check');

  // Already logged-in trying to reach login/register → go to dashboard
  if (isLoggedIn && isAuthOnly(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Not logged-in trying to reach protected route → go to login
  if (!isLoggedIn && !isPublic(pathname)) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image  (image optimization)
     * - favicon.ico
     * - public folder assets (icons/, images/, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|icons/|images/|sw.js|manifest.json).*)',
  ],
};
