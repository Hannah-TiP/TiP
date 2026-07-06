import { describe, it, expect } from 'vitest';
import robots, { DISALLOWED_PATHS } from '@/app/robots';
import { SITE_ORIGIN } from '@/lib/seo/locale';

const origin = SITE_ORIGIN.replace(/\/$/, '');

describe('robots', () => {
  const result = robots();

  it('allows all and points the sitemap at SITE_ORIGIN', () => {
    const rules = Array.isArray(result.rules) ? result.rules[0] : result.rules;
    expect(rules.userAgent).toBe('*');
    expect(rules.allow).toBe('/');
    expect(result.sitemap).toBe(`${origin}/sitemap.xml`);
  });

  it('disallows authed / transactional / api paths', () => {
    const rules = Array.isArray(result.rules) ? result.rules[0] : result.rules;
    const disallow = rules.disallow as string[];
    for (const path of ['/my-page', '/checkout', '/quotes', '/api', '/sign-in', '/register']) {
      expect(disallow).toContain(path);
    }
  });

  it('does not disallow public content routes', () => {
    expect(DISALLOWED_PATHS).not.toContain('/magazine');
    expect(DISALLOWED_PATHS).not.toContain('/dream-hotels');
    expect(DISALLOWED_PATHS).not.toContain('/signature-journeys');
  });
});
