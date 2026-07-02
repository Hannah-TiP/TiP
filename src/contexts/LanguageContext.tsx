'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import en from '@/translations/en.json';
import kr from '@/translations/kr.json';
import { resolveClientLanguage } from '@/lib/detect-language';

export type Lang = 'en' | 'kr';
export type TranslationKeys = keyof typeof en;

const translations: Record<Lang, Record<string, string>> = { en, kr };

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKeys) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

/**
 * @param initialLang language resolved server-side from the `Accept-Language`
 *   header (see `resolveServerLanguage`). It is the SSR first-paint language, so
 *   both the server and the client's FIRST render use it — this avoids a
 *   hydration mismatch / flash of the wrong language. After hydration a
 *   `useEffect` reconciles it with localStorage + navigator.language (the
 *   detection ladder), which is a post-hydration update and won't warn.
 */
export function LanguageProvider({
  children,
  initialLang,
}: {
  children: ReactNode;
  initialLang: Lang;
}) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  useEffect(() => {
    // Post-hydration reconciliation: read client-only signals (localStorage
    // override + navigator.language) that the server couldn't see, and apply
    // them on top of the SSR-provided initial language. Synchronous setState
    // here is intentional and safe — it runs once after the first (matching)
    // paint, so it never causes a hydration mismatch.
    const saved = localStorage.getItem('tip-lang');
    const reconciled = resolveClientLanguage(saved, navigator.language, initialLang);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLangState((current) => (reconciled === current ? current : reconciled));
  }, [initialLang]);

  const setLang = (newLang: Lang) => {
    setLangState(newLang);
    localStorage.setItem('tip-lang', newLang);
  };

  const t = (key: TranslationKeys): string => {
    return translations[lang][key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
