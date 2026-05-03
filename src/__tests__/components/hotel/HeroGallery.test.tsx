/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-unused-vars */
import type { ImgHTMLAttributes } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import HeroGallery from '@/components/hotel/HeroGallery';

vi.mock('next/image', () => ({
  default: ({
    fill: _fill,
    priority: _priority,
    ...props
  }: ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; priority?: boolean }) => (
    <img {...props} alt={props.alt} />
  ),
}));

afterEach(() => cleanup());

describe('HeroGallery', () => {
  it('renders the hotel name as h1 and the subtitle', () => {
    render(
      <HeroGallery
        images={['/hero.jpg', '/2.jpg', '/3.jpg']}
        hotelName="Aman Tokyo"
        subtitle="Tokyo, Japan"
        starRating="5"
        showTipCertified
        tipCertifiedLabel="TiP Certified"
      />,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Aman Tokyo' })).toBeTruthy();
    expect(screen.getByText('Tokyo, Japan')).toBeTruthy();
    expect(screen.getByText('★★★★★')).toBeTruthy();
    expect(screen.getByText('TiP Certified')).toBeTruthy();
  });

  it('renders the main image even when only one image is supplied', () => {
    render(
      <HeroGallery
        images={['/hero.jpg']}
        hotelName="Aman Tokyo"
        starRating={null}
        tipCertifiedLabel="TiP Certified"
      />,
    );

    expect(screen.getByRole('img', { name: 'Aman Tokyo' })).toBeTruthy();
  });

  it('omits star badge when star_rating has no numeric component', () => {
    render(
      <HeroGallery
        images={['/hero.jpg']}
        hotelName="Aman Tokyo"
        starRating="luxury"
        tipCertifiedLabel="TiP Certified"
      />,
    );

    expect(screen.queryByText(/★/)).toBeNull();
  });
});
