import type { NavKey } from '@/lib/header-config';

export interface NavLink {
  key: NavKey;
  label: string;
  href: string;
  /**
   * `protected: true` disables Link prefetch on auth-gated routes. Prefetching
   * them would race with the user's actual click: middleware redirects the
   * prefetch to /sign-in?redirect=<pathname> (no query) and Next.js caches that
   * redirect, so a later router.push('/concierge?prefill=...') uses the cached
   * unparameterized redirect — dropping the prefill query on its way to sign-in.
   */
  protected?: boolean;
}

/**
 * Primary site-navigation links. Shared between the desktop <Header> and the
 * mobile <MobileNav> drawer so both render the same set in the same order.
 */
export const navLinks: NavLink[] = [
  { key: 'dream-hotels', label: 'DREAM HOTELS', href: '/dream-hotels' },
  { key: 'more-dreams', label: 'MORE DREAMS', href: '/more-dreams' },
  { key: 'signature-journeys', label: 'SIGNATURE JOURNEYS', href: '/signature-journeys' },
  { key: 'about', label: 'ABOUT', href: '/about' },
  { key: 'concierge', label: 'CONCIERGE', href: '/concierge', protected: true },
];
