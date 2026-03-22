/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-unused-vars */
import type { AnchorHTMLAttributes, ImgHTMLAttributes } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import HotelDetailPage from '@/app/hotel/[id]/page';
import { apiClient } from '@/lib/api-client';

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'aman-tokyo' }),
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock('next/image', () => ({
  default: ({
    fill: _fill,
    ...props
  }: ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean }) => (
    <img {...props} alt={props.alt} />
  ),
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

vi.mock('@/components/TopBar', () => ({
  default: () => <div>TopBar</div>,
}));

vi.mock('@/components/Footer', () => ({
  default: () => <div>Footer</div>,
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    getHotelBySlug: vi.fn(),
  },
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('HotelDetailPage', () => {
  it('renders localized hotel fields from the v2 hotel shape', async () => {
    vi.mocked(apiClient.getHotelBySlug).mockResolvedValue({
      id: 1,
      slug: 'aman-tokyo',
      status: 'published',
      star_rating: '5',
      city_id: 1,
      brand_id: 1,
      name: { en: 'Aman Tokyo', kr: '아만 도쿄' },
      address: { en: 'Tokyo, Japan', kr: '일본 도쿄' },
      overview: { en: 'A serene urban sanctuary.', kr: '도심 속 고요한 안식처.' },
      images: [
        { original: 'https://example.com/hero.jpg' },
        { original: 'https://example.com/room.jpg' },
      ],
      benefits: [],
      rooms: [],
      features: [],
      faqs: [],
      policies: [],
      highlights: [{ highlight_type: 'tag', text: { en: 'TiP Pick', kr: 'TiP 추천' } }],
      external_links: [{ link_type: 'google_map', url: 'https://maps.example.com' }],
      schema_version: 1,
    });

    render(<HotelDetailPage />);

    expect(await screen.findByText('Aman Tokyo')).toBeTruthy();
    expect(screen.getAllByText('Tokyo, Japan').length).toBeGreaterThan(0);
    expect(screen.getAllByText('A serene urban sanctuary.').length).toBeGreaterThan(0);
    expect(screen.getByText('TiP Pick')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'View Map' }).getAttribute('href')).toBe(
      'https://maps.example.com',
    );
  });
});
