import { describe, expect, it } from 'vitest';
import { resolveHeaderConfig } from '@/lib/header-config';

describe('resolveHeaderConfig — marketing overlay pages', () => {
  it('uses overlay variant on / with no active nav', () => {
    expect(resolveHeaderConfig('/')).toEqual({
      variant: 'overlay',
      activeNav: null,
      subNav: null,
    });
  });

  it('uses overlay variant on /dream-hotels and highlights Dream Hotels', () => {
    expect(resolveHeaderConfig('/dream-hotels')).toEqual({
      variant: 'overlay',
      activeNav: 'dream-hotels',
      subNav: null,
    });
  });

  it('uses overlay variant on /more-dreams and highlights More Dreams', () => {
    expect(resolveHeaderConfig('/more-dreams')).toEqual({
      variant: 'overlay',
      activeNav: 'more-dreams',
      subNav: null,
    });
  });

  it('uses overlay variant on /signature-journeys and highlights Signature Journeys', () => {
    expect(resolveHeaderConfig('/signature-journeys')).toEqual({
      variant: 'overlay',
      activeNav: 'signature-journeys',
      subNav: null,
    });
  });

  it('normalizes a trailing slash on /signature-journeys', () => {
    expect(resolveHeaderConfig('/signature-journeys/')).toEqual({
      variant: 'overlay',
      activeNav: 'signature-journeys',
      subNav: null,
    });
  });

  it('normalizes a trailing slash on a marketing path', () => {
    expect(resolveHeaderConfig('/dream-hotels/')).toEqual({
      variant: 'overlay',
      activeNav: 'dream-hotels',
      subNav: null,
    });
  });
});

describe('resolveHeaderConfig — no-header (auth + onboarding) routes', () => {
  for (const path of [
    '/sign-in',
    '/sign-in?callbackUrl=/my-page',
    '/register',
    '/forgot-password',
    '/onboarding',
    '/onboarding/step-2',
  ]) {
    it(`renders no header on ${path}`, () => {
      // strip query for the resolver (it only ever receives a pathname,
      // but guard the contract anyway)
      const pathname = path.split('?')[0];
      expect(resolveHeaderConfig(pathname)).toEqual({
        variant: 'none',
        activeNav: null,
        subNav: null,
      });
    });
  }

  it('treats auth subpaths as no-header', () => {
    expect(resolveHeaderConfig('/sign-in/anything').variant).toBe('none');
  });
});

describe('resolveHeaderConfig — section landing pages (app variant)', () => {
  it('highlights About on /about', () => {
    expect(resolveHeaderConfig('/about')).toEqual({
      variant: 'app',
      activeNav: 'about',
      subNav: null,
    });
  });

  it('highlights Concierge on /concierge', () => {
    expect(resolveHeaderConfig('/concierge')).toEqual({
      variant: 'app',
      activeNav: 'concierge',
      subNav: null,
    });
  });

  it('keeps Concierge highlighted on a /concierge subpath', () => {
    expect(resolveHeaderConfig('/concierge/anything')).toEqual({
      variant: 'app',
      activeNav: 'concierge',
      subNav: null,
    });
  });
});

describe('resolveHeaderConfig — detail / checkout parent-section highlight', () => {
  it('/hotel/* highlights Dream Hotels (app variant)', () => {
    expect(resolveHeaderConfig('/hotel/679')).toEqual({
      variant: 'app',
      activeNav: 'dream-hotels',
      subNav: null,
    });
  });

  it('/restaurant/* highlights More Dreams', () => {
    expect(resolveHeaderConfig('/restaurant/47')).toEqual({
      variant: 'app',
      activeNav: 'more-dreams',
      subNav: null,
    });
  });

  it('/activity/* highlights More Dreams (accepted tradeoff: shared detail route, even for kind=package)', () => {
    expect(resolveHeaderConfig('/activity/24')).toEqual({
      variant: 'app',
      activeNav: 'more-dreams',
      subNav: null,
    });
  });

  it('/quotes/* highlights My Page', () => {
    expect(resolveHeaderConfig('/quotes/9')).toEqual({
      variant: 'app',
      activeNav: 'my-page',
      subNav: null,
    });
  });

  it('/checkout/* highlights My Page and is app variant (no overlay over Flywire)', () => {
    expect(resolveHeaderConfig('/checkout/flywire')).toEqual({
      variant: 'app',
      activeNav: 'my-page',
      subNav: null,
    });
  });
});

describe('resolveHeaderConfig — /my-page/** SubNav tab mapping', () => {
  const cases: [string, string][] = [
    ['/my-page', 'Upcoming Travels'],
    ['/my-page/trip/55', 'Upcoming Travels'],
    ['/my-page/travel-history', 'Travel History'],
    ['/my-page/travel-history/55', 'Travel History'],
    ['/my-page/travel-history/55/reviews', 'Travel History'],
    ['/my-page/hotel-review', 'Travel History'],
    ['/my-page/credits', 'Credits'],
    ['/my-page/membership', 'Membership'],
    ['/my-page/referrals', 'Referrals'],
    ['/my-page/wishlist', 'Wishlist'],
    ['/my-page/my-profile', 'My Profile'],
  ];

  for (const [path, tab] of cases) {
    it(`${path} -> SubNav "${tab}", app variant, My Page active`, () => {
      expect(resolveHeaderConfig(path)).toEqual({
        variant: 'app',
        activeNav: 'my-page',
        subNav: { active: tab },
      });
    });
  }

  it('falls back to Upcoming Travels for an unmapped /my-page subpath', () => {
    expect(resolveHeaderConfig('/my-page/something-new')).toEqual({
      variant: 'app',
      activeNav: 'my-page',
      subNav: { active: 'Upcoming Travels' },
    });
  });
});

describe('resolveHeaderConfig — default fallback', () => {
  it('returns app variant with no active nav for an unknown route', () => {
    expect(resolveHeaderConfig('/totally-unknown')).toEqual({
      variant: 'app',
      activeNav: null,
      subNav: null,
    });
  });

  it('defaults an empty pathname to the overlay landing config', () => {
    expect(resolveHeaderConfig('')).toEqual({
      variant: 'overlay',
      activeNav: null,
      subNav: null,
    });
  });
});
