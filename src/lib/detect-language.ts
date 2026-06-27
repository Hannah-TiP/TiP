import type { Lang } from '@/contexts/LanguageContext';

/**
 * The first-visit static default for the consumer FE.
 *
 * This is Korea-centric (the audience is primarily Korean), and is the last
 * resort once every locale signal has failed. NOTE: this is independent of the
 * backend's request-time default, which stays EN.
 */
export const FE_DEFAULT_LANG: Lang = 'kr';

/**
 * Map a single BCP-47 locale tag to one of our two supported UI languages.
 *
 * `ko`, `ko-KR`, `KO`, etc. → 'kr'; everything else → 'en'. An empty / nullish
 * tag yields null so callers can fall through to the next signal in the ladder.
 */
export function langFromLocale(locale: string | null | undefined): Lang | null {
  if (!locale) return null;
  const normalized = locale.trim().toLowerCase();
  if (!normalized) return null;
  if (normalized === 'ko' || normalized.startsWith('ko-')) return 'kr';
  // Some browsers historically emit 'kr' as a language subtag; accept it too.
  if (normalized === 'kr' || normalized.startsWith('kr-')) return 'kr';
  return 'en';
}

/**
 * Resolve the SSR first-paint language from the HTTP `Accept-Language` header.
 *
 * Reads the header's comma-separated tags in order (ignoring q-weights — the
 * browser already lists them by preference) and returns the language of the
 * first tag that maps to a supported UI language. Falls back to the static FE
 * default when the header is missing or contains no recognized tag.
 */
export function resolveServerLanguage(acceptLanguage: string | null | undefined): Lang {
  if (!acceptLanguage) return FE_DEFAULT_LANG;
  const tags = acceptLanguage.split(',');
  for (const raw of tags) {
    const tag = raw.split(';')[0];
    const lang = langFromLocale(tag);
    if (lang) return lang;
  }
  return FE_DEFAULT_LANG;
}

/**
 * Reconcile the client-side language on hydration, following the detection
 * ladder:
 *   1. saved preference (localStorage `tip-lang`) — wins once set.
 *   2. navigator.language — client first-visit default.
 *   3. the SSR-provided value (already derived from Accept-Language) — kept when
 *      there's no saved pref and no usable navigator signal.
 *
 * The static FE default is already baked into `serverLang`, so it is the final
 * fallback here too.
 */
export function resolveClientLanguage(
  savedPref: string | null | undefined,
  navigatorLanguage: string | null | undefined,
  serverLang: Lang,
): Lang {
  if (savedPref === 'en' || savedPref === 'kr') return savedPref;
  const fromNavigator = langFromLocale(navigatorLanguage);
  if (fromNavigator) return fromNavigator;
  return serverLang;
}
