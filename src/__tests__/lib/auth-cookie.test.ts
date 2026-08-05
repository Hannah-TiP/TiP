import { describe, expect, it } from 'vitest';
import { isSecureAuthCookie } from '@/lib/auth-cookie';

describe('isSecureAuthCookie', () => {
  it('https AUTH_URL → secure, regardless of request protocol', () => {
    expect(isSecureAuthCookie('https://www.travelinyourpocket.com', 'http:')).toBe(true);
    expect(isSecureAuthCookie('https://www.travelinyourpocket.com', 'https:')).toBe(true);
  });

  it('http AUTH_URL → insecure (local prod build over http://localhost)', () => {
    expect(isSecureAuthCookie('http://localhost:3000', 'http:')).toBe(false);
    // AUTH_URL wins even if the request somehow arrives as https
    expect(isSecureAuthCookie('http://localhost:3000', 'https:')).toBe(false);
  });

  it('unset AUTH_URL + https request → secure', () => {
    expect(isSecureAuthCookie(undefined, 'https:')).toBe(true);
  });

  it('unset AUTH_URL + http request → insecure', () => {
    expect(isSecureAuthCookie(undefined, 'http:')).toBe(false);
  });

  it('empty-string AUTH_URL falls back to the request protocol', () => {
    expect(isSecureAuthCookie('', 'https:')).toBe(true);
    expect(isSecureAuthCookie('', 'http:')).toBe(false);
  });

  it('NEXTAUTH_URL honored as fallback name via the call-site ?? expression', () => {
    // Mirrors the middleware call site:
    //   isSecureAuthCookie(process.env.AUTH_URL ?? process.env.NEXTAUTH_URL, protocol)
    const AUTH_URL = undefined;
    const NEXTAUTH_URL = 'https://www.travelinyourpocket.com';
    expect(isSecureAuthCookie(AUTH_URL ?? NEXTAUTH_URL, 'http:')).toBe(true);

    const NEXTAUTH_URL_HTTP = 'http://localhost:3000';
    expect(isSecureAuthCookie(AUTH_URL ?? NEXTAUTH_URL_HTTP, 'https:')).toBe(false);
  });
});
