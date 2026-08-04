import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';
import { isSecureAuthCookie } from '@/lib/auth-cookie';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Mirror Auth.js core: cookie security follows the AUTH_URL scheme (request
  // protocol as fallback), NOT NODE_ENV — a local prod build over http must
  // read the non-`__Secure-` cookie. NOTE: `secureCookie` must stay explicit;
  // @auth/core's getToken defaults it to false, which would break https deploys.
  const secureCookie = isSecureAuthCookie(
    process.env.AUTH_URL ?? process.env.NEXTAUTH_URL,
    request.nextUrl.protocol,
  );

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie,
  });

  const isLoggedIn = !!token && !token.error;
  const isProtectedRoute =
    pathname.startsWith('/my-page') || pathname === '/concierge' || pathname === '/onboarding';
  const isAuthRoute = pathname === '/sign-in';

  if (isProtectedRoute && !isLoggedIn) {
    const url = new URL('/sign-in', request.url);
    // Preserve query string so flows like SearchBar → /concierge?prefill=1&...
    // survive the round-trip through sign-in.
    const target = request.nextUrl.search ? `${pathname}${request.nextUrl.search}` : pathname;
    url.searchParams.set('redirect', target);
    return NextResponse.redirect(url);
  }
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL('/my-page', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/my-page/:path*', '/sign-in', '/concierge', '/onboarding'],
};
