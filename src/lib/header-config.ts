/**
 * Header configuration resolver.
 *
 * Single source of truth for site-header behavior. Given the current
 * pathname it returns the header variant, the active primary-nav link,
 * and (only on /my-page/**) the active SubNav tab.
 *
 * Pure function, no React — exhaustively unit-tested in
 * src/__tests__/lib/header-config.test.ts. Keep all header routing logic
 * here; the Header component must not encode pathname rules of its own.
 */

export type HeaderVariant = 'overlay' | 'app' | 'none';

/** Primary-nav link keys. Matches the labels rendered by Header. */
export type NavKey =
  | 'dream-hotels'
  | 'more-dreams'
  | 'signature-journeys'
  | 'about'
  | 'concierge'
  | 'my-page';

/** SubNav tab keys (labels rendered by SubNav, only on /my-page/**). */
export type SubNavKey =
  | 'Upcoming Travels'
  | 'Shared With Me'
  | 'Travel History'
  | 'Credits'
  | 'Membership'
  | 'Referrals'
  | 'Wishlist'
  | 'My Profile';

export interface HeaderConfig {
  /** overlay = transparent hero treatment; app = standard light bar; none = render nothing. */
  variant: HeaderVariant;
  /** Highlighted primary-nav link, or null when nothing is highlighted. */
  activeNav: NavKey | null;
  /** Present only on /my-page/**; carries the active SubNav tab. */
  subNav: { active: SubNavKey } | null;
}

/** Routes (and their subpaths) that render NO header at all. */
const NO_HEADER_PREFIXES = ['/sign-in', '/register', '/forgot-password', '/onboarding'];

/** Routes (and their subpaths) that use the transparent overlay variant. */
const OVERLAY_PATHS = ['/', '/dream-hotels', '/more-dreams', '/signature-journeys'];

function normalize(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.replace(/\/+$/, '');
  }
  return pathname;
}

function isPathOrSubpath(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(prefix + '/');
}

/**
 * Resolve the active SubNav tab from a /my-page subpath.
 *
 * Mapping:
 *  - /my-page and /my-page/trip/*           -> Upcoming Travels
 *  - /my-page/shared-trips*                 -> Shared With Me
 *  - /my-page/travel-history*               -> Travel History
 *      (includes the post-trip review session at
 *       /my-page/travel-history/[id]/reviews)
 *  - /my-page/credits                       -> Credits
 *  - /my-page/membership                    -> Membership
 *  - /my-page/referrals                     -> Referrals
 *  - /my-page/wishlist                      -> Wishlist
 *  - /my-page/my-profile                    -> My Profile
 *  - any other /my-page subpath             -> Upcoming Travels (dashboard fallback)
 */
function resolveMyPageTab(pathname: string): SubNavKey {
  if (isPathOrSubpath(pathname, '/my-page/shared-trips')) return 'Shared With Me';
  if (isPathOrSubpath(pathname, '/my-page/travel-history')) return 'Travel History';
  if (isPathOrSubpath(pathname, '/my-page/credits')) return 'Credits';
  if (isPathOrSubpath(pathname, '/my-page/membership')) return 'Membership';
  if (isPathOrSubpath(pathname, '/my-page/referrals')) return 'Referrals';
  if (isPathOrSubpath(pathname, '/my-page/wishlist')) return 'Wishlist';
  if (isPathOrSubpath(pathname, '/my-page/my-profile')) return 'My Profile';
  // /my-page, /my-page/trip/*, and any unmapped subpath fall back to the
  // dashboard tab so the SubNav always has a sensible active state.
  return 'Upcoming Travels';
}

export function resolveHeaderConfig(rawPathname: string): HeaderConfig {
  const pathname = normalize(rawPathname || '/');

  // No-header routes (auth + onboarding) win over everything else.
  for (const prefix of NO_HEADER_PREFIXES) {
    if (isPathOrSubpath(pathname, prefix)) {
      return { variant: 'none', activeNav: null, subNav: null };
    }
  }

  // Marketing overlay pages — exact paths only (no overlay subpaths today).
  if (OVERLAY_PATHS.includes(pathname)) {
    const activeNav: NavKey | null =
      pathname === '/dream-hotels'
        ? 'dream-hotels'
        : pathname === '/more-dreams'
          ? 'more-dreams'
          : pathname === '/signature-journeys'
            ? 'signature-journeys'
            : null;
    return { variant: 'overlay', activeNav, subNav: null };
  }

  // /my-page/** — app variant + SubNav.
  if (isPathOrSubpath(pathname, '/my-page')) {
    return {
      variant: 'app',
      activeNav: 'my-page',
      subNav: { active: resolveMyPageTab(pathname) },
    };
  }

  // Section landing pages.
  if (isPathOrSubpath(pathname, '/dream-hotels')) {
    return { variant: 'app', activeNav: 'dream-hotels', subNav: null };
  }
  if (isPathOrSubpath(pathname, '/more-dreams')) {
    return { variant: 'app', activeNav: 'more-dreams', subNav: null };
  }
  if (isPathOrSubpath(pathname, '/signature-journeys')) {
    return { variant: 'app', activeNav: 'signature-journeys', subNav: null };
  }
  if (isPathOrSubpath(pathname, '/about')) {
    return { variant: 'app', activeNav: 'about', subNav: null };
  }
  if (isPathOrSubpath(pathname, '/concierge')) {
    return { variant: 'app', activeNav: 'concierge', subNav: null };
  }

  // Detail / checkout pages highlight their parent section.
  if (isPathOrSubpath(pathname, '/hotel')) {
    return { variant: 'app', activeNav: 'dream-hotels', subNav: null };
  }
  // Accepted tradeoff: signature journeys (kind=package) and local
  // experiences share one detail route (/activity/[id]). The pathname carries
  // no `kind`, so this can't tell a package detail from a local-experience
  // one — both highlight More Dreams. We deliberately do NOT add a separate
  // /signature-journeys/[id] route just to recover the parent highlight.
  if (isPathOrSubpath(pathname, '/restaurant') || isPathOrSubpath(pathname, '/activity')) {
    return { variant: 'app', activeNav: 'more-dreams', subNav: null };
  }
  if (isPathOrSubpath(pathname, '/quotes') || isPathOrSubpath(pathname, '/checkout')) {
    return { variant: 'app', activeNav: 'my-page', subNav: null };
  }

  // Default: standard app bar, nothing highlighted.
  return { variant: 'app', activeNav: null, subNav: null };
}
