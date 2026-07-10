import type { NavKey } from '@/lib/header-config';
import type { TranslationKeys } from '@/contexts/LanguageContext';

export interface NavLink {
  key: NavKey;
  /**
   * i18n catalog key for the visible label. Resolved via `t(labelKey)` in the
   * <Header> / <MobileNav> renderers — this data module stays plain (no React,
   * no t()). See translations/{en,kr}.json `nav.*` entries.
   */
  labelKey: TranslationKeys;
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
  { key: 'dream-hotels', labelKey: 'nav.dream_hotels', href: '/dream-hotels' },
  { key: 'more-dreams', labelKey: 'nav.more_dreams', href: '/more-dreams' },
  { key: 'signature-journeys', labelKey: 'nav.signature_journeys', href: '/signature-journeys' },
  { key: 'concierge', labelKey: 'nav.concierge', href: '/concierge', protected: true },
  { key: 'magazine', labelKey: 'nav.magazine', href: '/magazine' },
  { key: 'about', labelKey: 'nav.about', href: '/about' },
];
