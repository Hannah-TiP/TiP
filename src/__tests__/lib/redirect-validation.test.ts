import { describe, expect, it } from 'vitest';
import { buildAuthRedirectUrl, isSafeRedirectPath } from '@/lib/redirect-validation';

describe('isSafeRedirectPath', () => {
  it('accepts same-origin relative paths (with query strings)', () => {
    expect(isSafeRedirectPath('/my-page')).toBe(true);
    expect(isSafeRedirectPath('/concierge?prefill=1&cityId=7&city=Paris')).toBe(true);
  });

  it('rejects empty, non-string, and non-rooted values', () => {
    expect(isSafeRedirectPath('')).toBe(false);
    // @ts-expect-error — guarding the runtime non-string branch.
    expect(isSafeRedirectPath(undefined)).toBe(false);
    expect(isSafeRedirectPath('my-page')).toBe(false);
  });

  it('rejects external / protocol-relative / scheme-bearing values', () => {
    expect(isSafeRedirectPath('//evil.com')).toBe(false);
    expect(isSafeRedirectPath('/\\evil.com')).toBe(false);
    expect(isSafeRedirectPath('https://evil.com')).toBe(false);
    expect(isSafeRedirectPath('/\tjavascript:alert(1)')).toBe(false);
  });
});

describe('buildAuthRedirectUrl', () => {
  it('returns the bare base when no params are present', () => {
    expect(buildAuthRedirectUrl('/register', {})).toBe('/register');
    expect(buildAuthRedirectUrl('/onboarding', { ref: '', redirect: '' })).toBe('/onboarding');
  });

  it('threads only the referral code when no redirect is present', () => {
    expect(buildAuthRedirectUrl('/onboarding', { ref: 'ABCD1234' })).toBe(
      '/onboarding?ref=ABCD1234',
    );
  });

  it('threads a safe redirect, encoding its query string exactly once', () => {
    const redirect = '/concierge?prefill=1&cityId=7&city=Paris';
    const url = buildAuthRedirectUrl('/onboarding', { redirect });

    // The redirect value (itself a URL with a query) is encoded once so it
    // does not collide with the outer query — reading it back round-trips.
    const parsed = new URLSearchParams(url.split('?')[1]);
    expect(parsed.get('redirect')).toBe(redirect);
    expect(url).toBe('/onboarding?redirect=%2Fconcierge%3Fprefill%3D1%26cityId%3D7%26city%3DParis');
  });

  it('threads both ref and redirect without param collision', () => {
    const url = buildAuthRedirectUrl('/register', {
      ref: 'ABCD1234',
      redirect: '/concierge?prefill=1&cityId=7',
    });
    const parsed = new URLSearchParams(url.split('?')[1]);
    expect(parsed.get('ref')).toBe('ABCD1234');
    expect(parsed.get('redirect')).toBe('/concierge?prefill=1&cityId=7');
  });

  it('drops an unsafe redirect (open-redirect guard) while keeping ref', () => {
    const url = buildAuthRedirectUrl('/register', {
      ref: 'ABCD1234',
      redirect: 'https://evil.com',
    });
    const parsed = new URLSearchParams(url.split('?')[1]);
    expect(parsed.get('redirect')).toBeNull();
    expect(parsed.get('ref')).toBe('ABCD1234');
    expect(url).toBe('/register?ref=ABCD1234');
  });

  it('drops a protocol-relative redirect entirely when no ref is present', () => {
    expect(buildAuthRedirectUrl('/onboarding', { redirect: '//evil.com' })).toBe('/onboarding');
  });
});
