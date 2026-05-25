import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import GuestsDropdown from '@/components/GuestsDropdown';
import enTranslations from '@/translations/en.json';
import krTranslations from '@/translations/kr.json';

const mockUseLanguage = vi.fn();

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => mockUseLanguage(),
}));

afterEach(() => cleanup());

function setLocale(lang: 'en' | 'kr') {
  const translations = lang === 'en' ? enTranslations : krTranslations;
  mockUseLanguage.mockReturnValue({
    t: (key: string) => (translations as Record<string, string>)[key] ?? key,
    lang,
    setLang: () => {},
  });
}

describe('GuestsDropdown', () => {
  it('renders Adults and Children labels in English', () => {
    setLocale('en');
    render(<GuestsDropdown adults={2} kids={0} onChange={vi.fn()} onClose={vi.fn()} />);

    expect(screen.getByText('Adults')).toBeTruthy();
    expect(screen.getByText('Ages 13 or above')).toBeTruthy();
    expect(screen.getByText('Children')).toBeTruthy();
    expect(screen.getByText('Ages 2-12')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Done' })).toBeTruthy();
  });

  it('renders Adults and Children labels in Korean', () => {
    setLocale('kr');
    render(<GuestsDropdown adults={2} kids={0} onChange={vi.fn()} onClose={vi.fn()} />);

    expect(screen.getByText('성인')).toBeTruthy();
    expect(screen.getByText('만 13세 이상')).toBeTruthy();
    expect(screen.getByText('어린이')).toBeTruthy();
    expect(screen.getByText('만 2-12세')).toBeTruthy();
    expect(screen.getByRole('button', { name: '완료' })).toBeTruthy();
  });
});
