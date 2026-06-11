/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-unused-vars */
import type { ImgHTMLAttributes } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import enTranslations from '@/translations/en.json';
import PartnersMarquee, {
  LOGO_DISPLAY_HEIGHT,
  logoDisplayWidth,
  partners,
} from '@/components/PartnersMarquee';

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

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => (enTranslations as Record<string, string>)[key] ?? key,
    lang: 'en',
    setLang: () => {},
  }),
}));

afterEach(() => cleanup());

describe('PartnersMarquee', () => {
  it('renders one accessible logo image per partner', () => {
    render(<PartnersMarquee />);
    // The track holds the list twice for a seamless loop, but the second
    // (duplicate) half is aria-hidden, so only one image per partner is
    // exposed to assistive tech.
    expect(screen.getAllByRole('img')).toHaveLength(partners.length);
  });

  it('renders every logo twice in the DOM for the seamless loop', () => {
    const { container } = render(<PartnersMarquee />);
    expect(container.querySelectorAll('img')).toHaveLength(partners.length * 2);
  });

  it('gives every logo non-empty alt text matching the brand name', () => {
    render(<PartnersMarquee />);
    for (const partner of partners) {
      const matches = screen.getAllByAltText(partner.name);
      expect(matches.length).toBeGreaterThanOrEqual(1);
      expect(partner.name.trim()).not.toBe('');
    }
  });

  it('renders every logo at the uniform h-12 height, width-capped to the cell', () => {
    render(<PartnersMarquee />);
    for (const img of screen.getAllByRole('img')) {
      const classes = img.className.split(/\s+/);
      expect(classes).toContain('h-12');
      expect(classes).toContain('w-auto');
      expect(classes).toContain('max-w-full');
      expect(classes).toContain('object-contain');
      // The old cap-only sizing letter-boxed logos at uneven heights.
      expect(classes).not.toContain('max-h-12');
    }
  });

  it('passes per-logo dimensions that preserve each natural aspect ratio', () => {
    render(<PartnersMarquee />);
    for (const partner of partners) {
      expect(partner.width).toBeGreaterThan(0);
      expect(partner.height).toBeGreaterThan(0);
      const [img] = screen.getAllByAltText(partner.name);
      expect(Number(img.getAttribute('height'))).toBe(LOGO_DISPLAY_HEIGHT);
      expect(Number(img.getAttribute('width'))).toBe(logoDisplayWidth(partner));
    }
  });

  it('exposes the translated aria label on the marquee region', () => {
    const { container } = render(<PartnersMarquee />);
    const marquee = container.querySelector('.marquee');
    expect(marquee).not.toBeNull();
    expect(marquee?.getAttribute('aria-label')).toBe(enTranslations['home.partner_brands_aria']);
  });
});
