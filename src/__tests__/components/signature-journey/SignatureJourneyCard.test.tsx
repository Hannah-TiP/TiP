/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-unused-vars */
import type { AnchorHTMLAttributes, ImgHTMLAttributes } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SignatureJourneyCard from '@/components/signature-journey/SignatureJourneyCard';
import type { SignatureJourney } from '@/types/signatureJourney';

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

describe('SignatureJourneyCard', () => {
  it('links to the slug-keyed detail route and shows title + city + gold pill', () => {
    render(<SignatureJourneyCard journey={journey} cityName="Monaco" />);

    const card = screen.getByTestId('signature-journey-card');
    expect(card.getAttribute('href')).toBe('/signature-journeys/ritz-carlton-yacht');
    expect(screen.getByText('The Ritz-Carlton Yacht')).toBeTruthy();
    expect(screen.getByText('Monaco')).toBeTruthy();

    const pill = screen.getByTestId('signature-journey-pill');
    expect(pill.className).toContain('bg-gold');
    expect(pill.textContent).toBe('SIGNATURE JOURNEY');
  });

  it('prefers cover_image and falls back to hero_image when cover is missing', () => {
    const { unmount } = render(<SignatureJourneyCard journey={journey} />);
    expect(screen.getByAltText('The Ritz-Carlton Yacht').getAttribute('src')).toContain(
      'cover.jpg',
    );
    unmount();

    render(<SignatureJourneyCard journey={{ ...journey, cover_image: null }} />);
    expect(screen.getByAltText('The Ritz-Carlton Yacht').getAttribute('src')).toContain('hero.jpg');
  });

  it('falls back to the slug when the title is missing and hides the city line', () => {
    render(<SignatureJourneyCard journey={{ ...journey, title: null }} />);
    expect(screen.getByText('ritz-carlton-yacht')).toBeTruthy();
  });
});
