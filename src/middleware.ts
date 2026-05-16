import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const secureCookie = process.env.NODE_ENV === 'production';

  // NextAuth v5 uses 'authjs' cookie prefix; try both in case of version differences
  const token =
    (await getToken({ req: request, secret: process.env.AUTH_SECRET, secureCookie })) ??
    (await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
      secureCookie,
      cookieName: secureCookie ? '__Secure-authjs.session-token' : 'authjs.session-token',
    }));

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
