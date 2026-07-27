/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-unused-vars */
import type { AnchorHTMLAttributes, ImgHTMLAttributes } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import kr from '@/translations/kr.json';
import SignatureJourneyCard from '@/components/signature-journey/SignatureJourneyCard';
import type { SignatureJourney } from '@/types/signatureJourney';

const krCatalog = kr as Record<string, string>;

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    lang: 'kr' as const,
    setLang: vi.fn(),
    t: (key: string) => krCatalog[key] ?? key,
  }),
  LanguageProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('next/image', () => ({
  default: ({
    fill: _fill,
    priority: _priority,
    sizes: _sizes,
    ...props
  }: ImgHTMLAttributes<HTMLImageElement> & {
    fill?: boolean;
    priority?: boolean;
    sizes?: string;
  }) => <img {...props} alt={props.alt} />,
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

afterEach(() => cleanup());

const journey: SignatureJourney = {
  id: 4,
  slug: 'ritz-carlton-yacht',
  city_id: 10,
  status: 'published',
  title: { en: 'The Ritz-Carlton Yacht', kr: '리츠칼튼 요트' },
  cover_image: { original: 'https://example.com/cover.jpg' },
  hero_image: { original: 'https://example.com/hero.jpg' },
  schema_version: 1,
};

describe('SignatureJourneyCard (KR)', () => {
  it('renders the Korean title (heading + image alt) under the KR toggle', () => {
    render(<SignatureJourneyCard journey={journey} cityName="Monaco" />);

    expect(screen.getByText('리츠칼튼 요트')).toBeTruthy();
    expect(screen.getByAltText('리츠칼튼 요트')).toBeTruthy();
    expect(screen.queryByText('The Ritz-Carlton Yacht')).toBeNull();
  });
});
