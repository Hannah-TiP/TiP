import { describe, expect, it } from 'vitest';
import {
  FE_DEFAULT_LANG,
  langFromLocale,
  resolveServerLanguage,
  resolveClientLanguage,
} from '@/lib/detect-language';

describe('langFromLocale', () => {
  it('maps Korean locale tags to kr', () => {
    expect(langFromLocale('ko')).toBe('kr');
    expect(langFromLocale('ko-KR')).toBe('kr');
    expect(langFromLocale('KO')).toBe('kr');
    expect(langFromLocale('ko-kr')).toBe('kr');
  });

  it('accepts the legacy "kr" language subtag', () => {
    expect(langFromLocale('kr')).toBe('kr');
    expect(langFromLocale('kr-KR')).toBe('kr');
  });

  it('maps any non-Korean tag to en', () => {
    expect(langFromLocale('en')).toBe('en');
    expect(langFromLocale('en-US')).toBe('en');
    expect(langFromLocale('fr-FR')).toBe('en');
    expect(langFromLocale('ja')).toBe('en');
  });

  it('returns null for empty / nullish input so callers can fall through', () => {
    expect(langFromLocale('')).toBeNull();
    expect(langFromLocale('   ')).toBeNull();
    expect(langFromLocale(null)).toBeNull();
    expect(langFromLocale(undefined)).toBeNull();
  });

  it('does not treat a "ko"-prefixed unrelated tag like "kok" as Korean', () => {
    // Konkani (kok) shares the "ko" prefix but is not Korean.
    expect(langFromLocale('kok')).toBe('en');
  });
});

describe('resolveServerLanguage (Accept-Language ladder)', () => {
  it('returns kr for a Korean-first Accept-Language', () => {
    expect(resolveServerLanguage('ko-KR,ko;q=0.9,en;q=0.8')).toBe('kr');
  });

  it('returns en for an English Accept-Language', () => {
    expect(resolveServerLanguage('en-US,en;q=0.9')).toBe('en');
  });

  it('honors browser order: a Korean-first list resolves to kr', () => {
    expect(resolveServerLanguage('ko-KR,en;q=0.7')).toBe('kr');
  });

  it('treats an unsupported-but-non-Korean primary tag (e.g. fr) as en', () => {
    // French maps to our en fallback, so a French speaker prefers English over
    // Korean even when ko appears later in the list.
    expect(resolveServerLanguage('fr-FR,ko;q=0.7')).toBe('en');
  });

  it('falls back to the static FE default (kr) when header missing/unrecognized', () => {
    expect(resolveServerLanguage(null)).toBe('kr');
    expect(resolveServerLanguage(undefined)).toBe('kr');
    expect(resolveServerLanguage('')).toBe('kr');
    expect(FE_DEFAULT_LANG).toBe('kr');
  });
});

describe('resolveClientLanguage (hydration reconciliation)', () => {
  it('saved preference wins over everything else', () => {
    expect(resolveClientLanguage('kr', 'en-US', 'en')).toBe('kr');
    expect(resolveClientLanguage('en', 'ko-KR', 'kr')).toBe('en');
  });

  it('ignores an invalid saved preference and uses navigator next', () => {
    expect(resolveClientLanguage('xx', 'ko-KR', 'en')).toBe('kr');
  });

  it('uses navigator.language when there is no saved preference', () => {
    expect(resolveClientLanguage(null, 'ko-KR', 'en')).toBe('kr');
    expect(resolveClientLanguage(null, 'en-US', 'kr')).toBe('en');
  });

  it('keeps the server value when neither saved pref nor navigator give a signal', () => {
    expect(resolveClientLanguage(null, '', 'kr')).toBe('kr');
    expect(resolveClientLanguage(null, null, 'en')).toBe('en');
  });
});
