import type { AnchorHTMLAttributes } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import HotelBreadcrumb from '@/components/hotel/HotelBreadcrumb';

let mockLang: 'en' | 'kr' = 'en';

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => {
      const en: Record<string, string> = {
        'hotel.breadcrumb_home': 'Home',
        'hotel.breadcrumb_dream_hotels': 'Dream Hotels',
      };
      const kr: Record<string, string> = {
        'hotel.breadcrumb_home': '홈',
        'hotel.breadcrumb_dream_hotels': 'Dream Hotels',
      };
      return (mockLang === 'kr' ? kr : en)[key] ?? key;
    },
    lang: mockLang,
    setLang: () => {},
  }),
}));

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

beforeEach(() => {
  mockLang = 'en';
});

afterEach(() => cleanup());

describe('HotelBreadcrumb', () => {
  it('renders Home, Dream Hotels, optional city, and hotel name in order', () => {
    render(<HotelBreadcrumb hotelName="Aman Tokyo" cityLabel="Tokyo, Japan" />);

    const items = screen
      .getByRole('navigation', { name: /breadcrumb/i })
      .querySelectorAll('li:not([aria-hidden="true"])');
    const labels = Array.from(items).map((li) => li.textContent?.trim());
    expect(labels).toEqual(['Home', 'Dream Hotels', 'Tokyo, Japan', 'Aman Tokyo']);
  });

  it('omits the city segment when no cityLabel is provided', () => {
    render(<HotelBreadcrumb hotelName="Aman Tokyo" />);

    const items = screen
      .getByRole('navigation', { name: /breadcrumb/i })
      .querySelectorAll('li:not([aria-hidden="true"])');
    const labels = Array.from(items).map((li) => li.textContent?.trim());
    expect(labels).toEqual(['Home', 'Dream Hotels', 'Aman Tokyo']);
  });

  it('uses the Korean Home label when the language is kr', () => {
    mockLang = 'kr';
    render(<HotelBreadcrumb hotelName="Aman Tokyo" />);
    expect(screen.getByText('홈')).toBeTruthy();
  });
});
