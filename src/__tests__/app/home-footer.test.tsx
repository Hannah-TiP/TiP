/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-unused-vars */
import type { AnchorHTMLAttributes, ImgHTMLAttributes } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import HomePage from '@/app/page';

// LanguageContext is mocked globally (setup-language.ts) to resolve keys against
// the real EN catalog, so assertions below match the English footer copy.

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

// Stub the hero search + partner marquee so the test stays focused on the footer.
vi.mock('@/components/SearchBar', () => ({ default: () => <div>SearchBar</div> }));
vi.mock('@/components/PartnersMarquee', () => ({ default: () => <div>PartnersMarquee</div> }));

afterEach(() => cleanup());

describe('Home page footer', () => {
  it('renders the shared <Footer /> with working links the inline copy lacked', async () => {
    render(<HomePage />);

    // Privacy Policy is a working link in the shared Footer (it was a dead `#`
    // inline). findBy — the Footer content is lazy-loaded (SMA-306).
    const privacy = await screen.findByText('Privacy Policy');
    expect(privacy.closest('a')?.getAttribute('href')).toBe('/privacy-policy');

    // Terms of Service + Blog links exist only in the shared Footer.
    const terms = screen.getByText('Terms of Service');
    expect(terms.closest('a')?.getAttribute('href')).toBe('/terms-of-service');
    expect(screen.getByText('Blog')).toBeTruthy();

    // Cookie Settings is a <button> in the shared Footer (no such control inline).
    expect(screen.getByRole('button', { name: 'Cookie Settings' })).toBeTruthy();
  });
});
