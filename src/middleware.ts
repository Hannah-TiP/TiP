import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Log all cookie names present on every request to protected/auth routes
  const cookieNames = request.cookies.getAll().map(c => c.name);
  console.log(`[Middleware] ${pathname} — NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`[Middleware] cookies present:`, cookieNames);

  // Try both possible v5 cookie names
  const secureCookie = process.env.NODE_ENV === 'production';
  const v4CookieName = secureCookie ? '__Secure-next-auth.session-token' : 'next-auth.session-token';
  const v5CookieName = secureCookie ? '__Secure-authjs.session-token' : 'authjs.session-token';

  console.log(`[Middleware] looking for v4 name: ${v4CookieName}`);
  console.log(`[Middleware] looking for v5 name: ${v5CookieName}`);
  console.log(`[Middleware] has v4 cookie: ${request.cookies.has(v4CookieName)}`);
  console.log(`[Middleware] has v5 cookie: ${request.cookies.has(v5CookieName)}`);

  // Try with default (v4 name)
  const tokenV4 = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie,
  });
  console.log(`[Middleware] getToken (v4 name) result:`, tokenV4 ? `found — user: ${(tokenV4 as any)?.user?.email}` : 'null');

  // Try with explicit v5 name
  const tokenV5 = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie,
    cookieName: v5CookieName,
  });
  console.log(`[Middleware] getToken (v5 name) result:`, tokenV5 ? `found — user: ${(tokenV5 as any)?.user?.email}` : 'null');

  const token = tokenV4 ?? tokenV5;
  const isLoggedIn = !!token && !token.error;
  console.log(`[Middleware] isLoggedIn: ${isLoggedIn}`);

  const isProtectedRoute = pathname.startsWith('/my-page') || pathname === '/concierge';
  const isAuthRoute = pathname === '/sign-in';

  if (isProtectedRoute && !isLoggedIn) {
    const url = new URL('/sign-in', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL('/my-page', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/my-page/:path*', '/sign-in', '/concierge'],
};
