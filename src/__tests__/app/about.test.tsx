/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-unused-vars */
import type { AnchorHTMLAttributes, ImgHTMLAttributes } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AboutPage from '@/app/about/page';
import { partners } from '@/components/PartnersMarquee';

// jsdom has no IntersectionObserver; the page's Reveal-on-scroll effect needs it.
vi.stubGlobal(
  'IntersectionObserver',
  class {
    observe = vi.fn();
    disconnect = vi.fn();
    unobserve = vi.fn();
    takeRecords = vi.fn();
  },
);

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

vi.mock('next-auth/react', () => ({
  useSession: () => ({ status: 'unauthenticated', data: null }),
}));

vi.mock('@/components/Footer', () => ({
  default: () => <div>Footer</div>,
}));

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
    lang: 'en',
    setLang: () => {},
  }),
}));

afterEach(() => cleanup());

describe('About page partners section', () => {
  it('renders partner logos (images) from the shared marquee', () => {
    render(<AboutPage />);
    // Every shared partner has at least one rendered logo image.
    for (const partner of partners) {
      expect(screen.getAllByAltText(partner.name).length).toBeGreaterThanOrEqual(1);
    }
  });

  it('no longer renders the old hardcoded text-name list', () => {
    render(<AboutPage />);
    // The old fallback list rendered these as plain <span> text, not logos.
    // VistaJet / NetJets / Mastercard were text-only names with no logo asset
    // and must be gone now that we render the shared logo set.
    expect(screen.queryByText('VistaJet')).toBeNull();
    expect(screen.queryByText('NetJets')).toBeNull();
    expect(screen.queryByText('Mastercard')).toBeNull();
  });
});
