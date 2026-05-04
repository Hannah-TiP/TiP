import { describe, it, expect } from 'vitest';
import { isSafeRedirectPath } from '@/lib/redirect-validation';

/**
 * Tests for the same-origin guard used by the sign-in page.
 *
 * The guard is applied to BOTH `?callbackUrl=` and `?redirect=` query
 * params; a malicious value should be rejected so the page falls back
 * to the default destination instead of bouncing the user off-site.
 */
describe('isSafeRedirectPath', () => {
  describe('accepts safe relative paths', () => {
    it('accepts a simple absolute path', () => {
      expect(isSafeRedirectPath('/foo')).toBe(true);
    });

    it('accepts paths with multiple segments', () => {
      expect(isSafeRedirectPath('/my-page/trip/42')).toBe(true);
    });

    it('accepts paths with query strings', () => {
      expect(isSafeRedirectPath('/hotel/ritz-paris?reserve=1&checkin=2099-06-10')).toBe(true);
    });

    it('accepts paths with hash fragments', () => {
      expect(isSafeRedirectPath('/insights#section-2')).toBe(true);
    });
  });

  describe('rejects off-site or otherwise unsafe values', () => {
    it('rejects empty strings', () => {
      expect(isSafeRedirectPath('')).toBe(false);
    });

    it('rejects protocol-relative URLs (//evil.com)', () => {
      expect(isSafeRedirectPath('//evil.com')).toBe(false);
      expect(isSafeRedirectPath('//evil.com/path')).toBe(false);
    });

    it('rejects backslash-prefixed URLs (/\\evil.com)', () => {
      expect(isSafeRedirectPath('/\\evil.com')).toBe(false);
    });

    it('rejects absolute http URLs', () => {
      expect(isSafeRedirectPath('https://evil.com')).toBe(false);
      expect(isSafeRedirectPath('http://evil.com/path')).toBe(false);
    });

    it('rejects javascript: URIs', () => {
      expect(isSafeRedirectPath('javascript:alert(1)')).toBe(false);
    });

    it('rejects data: URIs', () => {
      expect(isSafeRedirectPath('data:text/html,<script>alert(1)</script>')).toBe(false);
    });

    it('rejects values that do not start with /', () => {
      expect(isSafeRedirectPath('foo')).toBe(false);
      expect(isSafeRedirectPath('foo/bar')).toBe(false);
    });

    it('rejects values with embedded whitespace or control characters', () => {
      // A leading space is sometimes used to smuggle a value past naive
      // prefix checks because some browsers strip whitespace.
      expect(isSafeRedirectPath(' /foo')).toBe(false);
      expect(isSafeRedirectPath('/foo\tbar')).toBe(false);
      expect(isSafeRedirectPath('/foo\nbar')).toBe(false);
      expect(isSafeRedirectPath('/\x00evil')).toBe(false);
    });
  });
});

/**
 * The sign-in page uses isSafeRedirectPath() like:
 *
 *   const redirectTo =
 *     (rawCallback && isSafeRedirectPath(rawCallback) ? rawCallback : null) ||
 *     (rawRedirect && isSafeRedirectPath(rawRedirect) ? rawRedirect : null) ||
 *     DEFAULT_REDIRECT;
 *
 * The cases below mirror that resolution to lock in the behaviour for
 * BOTH `callbackUrl` (current) and `redirect` (legacy) params.
 */
describe('sign-in callback resolution', () => {
  const DEFAULT_REDIRECT = '/my-page';

  function resolveRedirect(rawCallback: string | null, rawRedirect: string | null): string {
    return (
      (rawCallback && isSafeRedirectPath(rawCallback) ? rawCallback : null) ||
      (rawRedirect && isSafeRedirectPath(rawRedirect) ? rawRedirect : null) ||
      DEFAULT_REDIRECT
    );
  }

  describe('callbackUrl param', () => {
    it('accepts /foo', () => {
      expect(resolveRedirect('/foo', null)).toBe('/foo');
    });

    it('rejects //evil.com and falls back', () => {
      expect(resolveRedirect('//evil.com', null)).toBe(DEFAULT_REDIRECT);
    });

    it('rejects https://evil.com and falls back', () => {
      expect(resolveRedirect('https://evil.com', null)).toBe(DEFAULT_REDIRECT);
    });

    it('rejects javascript:alert(1) and falls back', () => {
      expect(resolveRedirect('javascript:alert(1)', null)).toBe(DEFAULT_REDIRECT);
    });
  });

  describe('legacy redirect param', () => {
    it('accepts /foo', () => {
      expect(resolveRedirect(null, '/foo')).toBe('/foo');
    });

    it('rejects //evil.com and falls back', () => {
      expect(resolveRedirect(null, '//evil.com')).toBe(DEFAULT_REDIRECT);
    });

    it('rejects https://evil.com and falls back', () => {
      expect(resolveRedirect(null, 'https://evil.com')).toBe(DEFAULT_REDIRECT);
    });

    it('rejects javascript:alert(1) and falls back', () => {
      expect(resolveRedirect(null, 'javascript:alert(1)')).toBe(DEFAULT_REDIRECT);
    });
  });

  describe('precedence', () => {
    it('uses callbackUrl when both are present and callbackUrl is safe', () => {
      expect(resolveRedirect('/foo', '/bar')).toBe('/foo');
    });

    it('falls through to redirect when callbackUrl is unsafe', () => {
      expect(resolveRedirect('//evil.com', '/bar')).toBe('/bar');
    });

    it('falls back to default when both are unsafe', () => {
      expect(resolveRedirect('//evil.com', 'https://evil.com')).toBe(DEFAULT_REDIRECT);
    });
  });
});
