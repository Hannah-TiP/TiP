/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-unused-vars */
import type { ImgHTMLAttributes } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import enTranslations from '@/translations/en.json';
import krTranslations from '@/translations/kr.json';
import Footer from '@/components/Footer';

vi.mock('next/image', () => ({
  default: ({
    fill: _fill,
    priority: _priority,
    loading: _loading,
    ...props
  }: ImgHTMLAttributes<HTMLImageElement> & {
    fill?: boolean;
    priority?: boolean;
  }) => <img {...props} alt={props.alt} />,
}));

let currentLang: 'en' | 'kr' = 'en';

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) =>
      ((currentLang === 'en' ? enTranslations : krTranslations) as Record<string, string>)[key] ??
      key,
    lang: currentLang,
    setLang: () => {},
  }),
}));

beforeEach(() => {
  currentLang = 'en';
});

afterEach(() => cleanup());

describe('Footer Instagram link', () => {
  it('renders an Instagram link with the correct href, target, and rel', () => {
    render(<Footer />);
    const link = screen.getByRole('link', { name: enTranslations['footer.instagram_aria'] });
    expect(link.getAttribute('href')).toBe('https://instagram.com/travelinyourpocket_official');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('hides the icon SVG from assistive tech and exposes the name on the anchor', () => {
    render(<Footer />);
    const link = screen.getByRole('link', { name: enTranslations['footer.instagram_aria'] });
    const svg = link.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
  });

  it('uses the Korean aria-label when the language is kr', () => {
    currentLang = 'kr';
    render(<Footer />);
    const link = screen.getByRole('link', { name: krTranslations['footer.instagram_aria'] });
    expect(link.getAttribute('href')).toBe('https://instagram.com/travelinyourpocket_official');
  });
});

describe('Footer business-registration info', () => {
  it('renders the real ParisClass legal data', () => {
    const { container } = render(<Footer />);
    const text = container.textContent ?? '';
    expect(text).toContain('주식회사 파리클래스');
    expect(text).toContain('887-86-03126');
    expect(text).toContain('서울특별시 서초대로 77길 59 (06611)');
    expect(text).toContain('2023-서울중구-1031');
    expect(text).toContain('travelmate@travelinyourpocket.com');
    expect(text).toContain('02-6013-7775');
  });

  it('contains none of the old placeholder business-registration strings', () => {
    const { container } = render(<Footer />);
    const text = container.textContent ?? '';
    expect(text).not.toContain('홍길동');
    expect(text).not.toContain('123-45-67890');
    expect(text).not.toContain('support@tip-ai.com');
    expect(text).not.toContain('02-1234-5678');
    expect(text).not.toContain('주식회사 티아이피에이아이');
    expect(text).not.toContain('테헤란로');
  });
});
