import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isLoggedIn = !!req.auth && !req.auth.error;
  const { pathname } = req.nextUrl;

  const isProtectedRoute = pathname.startsWith('/my-page') || pathname === '/concierge';
  const isAuthRoute = pathname === '/sign-in';

  if (isProtectedRoute && !isLoggedIn) {
    const url = new URL('/sign-in', req.nextUrl);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL('/my-page', req.nextUrl));
  }
});

export const config = {
  matcher: ['/my-page/:path*', '/sign-in', '/concierge'],
};
