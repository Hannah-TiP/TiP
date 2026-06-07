import { vi } from 'vitest';
import en from '@/translations/en.json';

/**
 * Global default mock for the i18n LanguageContext.
 *
 * Components migrated in SMA-82 call useLanguage().t(...) for their copy.
 * Unit tests that render those components without a LanguageProvider would
 * otherwise throw "useLanguage must be used within LanguageProvider". This
 * default mock resolves keys against the real EN catalog so existing text
 * assertions keep matching the English copy.
 *
 * Tests that need different behaviour (a specific lang, a setLang spy, etc.)
 * can still declare their own vi.mock('@/contexts/LanguageContext', ...) —
 * a file-local mock takes precedence over this global one.
 */
const catalog = en as Record<string, string>;

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    lang: 'en' as const,
    setLang: vi.fn(),
    t: (key: string) => catalog[key] ?? key,
  }),
  LanguageProvider: ({ children }: { children: React.ReactNode }) => children,
}));
