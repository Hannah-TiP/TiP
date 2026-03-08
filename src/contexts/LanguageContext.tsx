'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import en from '@/translations/en.json';
import kr from '@/translations/kr.json';

export type Lang = 'en' | 'kr';
type TranslationKeys = keyof typeof en;

const translations: Record<Lang, Record<string, string>> = { en, kr };

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKeys) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === 'undefined') return 'en';
    const saved = localStorage.getItem('tip-lang') as Lang | null;
    return saved && (saved === 'en' || saved === 'kr') ? saved : 'en';
  });

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
