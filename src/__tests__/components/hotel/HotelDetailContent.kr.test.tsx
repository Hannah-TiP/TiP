/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-unused-vars */
import type { ImgHTMLAttributes } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import kr from '@/translations/kr.json';
import HotelDetailContent from '@/components/hotel/HotelDetailContent';
import type { Hotel } from '@/types/hotel';

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

// EntityReviews fetches on mount — stub the client so the section renders inert.
vi.mock('@/lib/api-client', () => ({
  apiClient: {
    getReviewsByEntity: vi.fn().mockResolvedValue({
      reviews: [],
      aggregate: { average_rating: 0, review_count: 0 },
    }),
  },
}));

afterEach(() => cleanup());

const hotel: Hotel = {
  id: 42,
  slug: 'aman-tokyo',
  status: 'published',
  star_rating: '5',
  name: { en: 'Aman Tokyo', kr: '아만 도쿄' },
  address: { en: 'Otemachi, Tokyo', kr: '도쿄 오테마치' },
  overview: {
    en: 'A serene urban sanctuary.',
    kr: '고요한 도심 속 안식처.',
  },
  schema_version: 1,
};

describe('HotelDetailContent (KR)', () => {
  it('renders the hotel name, address and overview in Korean', () => {
    render(<HotelDetailContent hotel={hotel} />);

    // Name (hero heading + breadcrumb) resolves to KR.
    expect(screen.getAllByText('아만 도쿄').length).toBeGreaterThanOrEqual(1);
    // Address appears (breadcrumb / hero subtitle / location).
    expect(screen.getAllByText('도쿄 오테마치').length).toBeGreaterThanOrEqual(1);
    // Overview paragraph.
    expect(screen.getByText('고요한 도심 속 안식처.')).toBeTruthy();

    // English core fields must not leak under the KR toggle.
    expect(screen.queryByText('Aman Tokyo')).toBeNull();
    expect(screen.queryByText('A serene urban sanctuary.')).toBeNull();
  });
});
