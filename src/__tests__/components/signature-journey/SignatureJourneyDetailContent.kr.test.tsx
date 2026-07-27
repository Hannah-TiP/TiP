/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-unused-vars */
import type { AnchorHTMLAttributes, ImgHTMLAttributes } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import kr from '@/translations/kr.json';
import SignatureJourneyDetailContent from '@/components/signature-journey/SignatureJourneyDetailContent';
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

const journey: SignatureJourney = {
  id: 7,
  slug: 'ritz-carlton-yacht',
  status: 'published',
  title: { en: 'The Ritz-Carlton Yacht', kr: '리츠칼튼 요트' },
  description: { en: 'A refined voyage.', kr: '세련된 항해.' },
  lead: { en: 'The art of slow travel.', kr: '느린 여행의 미학.' },
  body: { en: 'Sail the Mediterranean.', kr: '지중해를 항해하세요.' },
  hero_image: { original: 'https://example.com/hero.jpg', alt: { en: 'Yacht', kr: '요트 사진' } },
  gallery: [{ original: 'https://example.com/g1.jpg', alt: { en: 'Deck', kr: '갑판 사진' } }],
  schema_version: 1,
};

const getSignatureJourneyBySlug = vi.fn().mockResolvedValue(journey);

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    getSignatureJourneyBySlug: (...args: unknown[]) => getSignatureJourneyBySlug(...args),
  },
}));

afterEach(() => cleanup());

describe('SignatureJourneyDetailContent (KR)', () => {
  it('renders title, description, lead, body and image alts in Korean', async () => {
    render(<SignatureJourneyDetailContent slug="ritz-carlton-yacht" />);

    // Title (async — resolves after the fetch).
    expect(await screen.findByText('리츠칼튼 요트')).toBeTruthy();
    expect(screen.getByText('세련된 항해.')).toBeTruthy();
    expect(screen.getByText('느린 여행의 미학.')).toBeTruthy();
    expect(screen.getByText('지중해를 항해하세요.')).toBeTruthy();
    // Hero + gallery image alts.
    expect(screen.getByAltText('요트 사진')).toBeTruthy();
    expect(screen.getByAltText('갑판 사진')).toBeTruthy();

    // English core fields must not leak under the KR toggle.
    expect(screen.queryByText('The Ritz-Carlton Yacht')).toBeNull();
    expect(screen.queryByText('The art of slow travel.')).toBeNull();
  });
});
