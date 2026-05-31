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
        images={[{ url: '/hero.jpg' }, { url: '/2.jpg' }, { url: '/3.jpg' }]}
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
        images={[{ url: '/hero.jpg' }]}
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
        images={[{ url: '/hero.jpg' }]}
        hotelName="Aman Tokyo"
        starRating="luxury"
        tipCertifiedLabel="TiP Certified"
      />,
    );

    expect(screen.queryByText(/★/)).toBeNull();
  });

  it('renders full-frame (no crop frame) when images have no crop', () => {
    const { container } = render(
      <HeroGallery
        images={[{ url: '/hero.jpg' }]}
        hotelName="Aman Tokyo"
        starRating={null}
        tipCertifiedLabel="TiP Certified"
      />,
    );

    expect(container.querySelector('[data-testid="cropped-image-frame"]')).toBeNull();
  });

  it('applies the render-time crop transform to images that carry a crop', () => {
    const { container } = render(
      <HeroGallery
        images={[
          { url: '/hero.jpg', crop: { x: 0.25, y: 0.1, width: 0.5, height: 0.25 } },
          { url: '/2.jpg' },
        ]}
        hotelName="Aman Tokyo"
        starRating={null}
        tipCertifiedLabel="TiP Certified"
      />,
    );

    const frame = container.querySelector('[data-testid="cropped-image-frame"]') as HTMLElement;
    expect(frame).not.toBeNull();
    // width: 100/0.5 = 200%, height: 100/0.25 = 400%
    expect(frame.style.width).toBe('200%');
    expect(frame.style.height).toBe('400%');
    // left: -0.25*100/0.5 = -50%, top: -0.1*100/0.25 = -40%
    expect(frame.style.left).toBe('-50%');
    expect(frame.style.top).toBe('-40%');
  });
});
