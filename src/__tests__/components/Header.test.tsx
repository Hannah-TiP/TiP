import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const pathnameRef: { current: string } = { current: '/' };
const sessionRef: { current: { data: unknown } } = { current: { data: null } };

vi.mock('next/navigation', () => ({
  usePathname: () => pathnameRef.current,
}));

vi.mock('next-auth/react', () => ({
  useSession: () => sessionRef.current,
  signOut: vi.fn(),
}));

const I18N: Record<string, string> = {
  'nav.dream_hotels': 'DREAM HOTELS',
  'nav.more_dreams': 'MORE DREAMS',
  'nav.signature_journeys': 'SIGNATURE JOURNEYS',
  'nav.concierge': 'CONCIERGE',
  'nav.magazine': 'MAGAZINE',
  'nav.about': 'ABOUT',
  'nav.language_toggle': 'EN | KR',
  'nav.menu_open': 'Open menu',
  'nav.menu_close': 'Close menu',
  'nav.sign_in': 'SIGN IN',
  'nav.my_page': 'MY PAGE',
  'nav.logout': 'LOGOUT',
  'nav.logo_alt': 'TiP',
  'subnav.upcoming_travels': 'Upcoming Travels',
  'subnav.shared_with_me': 'Shared With Me',
  'subnav.travel_history': 'Travel History',
  'subnav.membership': 'Membership',
  'subnav.credits': 'Credits',
  'subnav.referrals': 'Referrals',
  'subnav.wishlist': 'Wishlist',
  'subnav.my_profile': 'My Profile',
};

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    lang: 'en' as const,
    setLang: vi.fn(),
    t: (key: string) => I18N[key] ?? key,
  }),
}));

import Header from '@/components/Header';

afterEach(cleanup);

describe('Header — render gating', () => {
  it('renders nothing on a no-header (auth) route', () => {
    pathnameRef.current = '/sign-in';
    const { container } = render(<Header />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing on /onboarding', () => {
    pathnameRef.current = '/onboarding';
    const { container } = render(<Header />);
    expect(container.firstChild).toBeNull();
  });
});

describe('Header — desktop auth controls render exactly once', () => {
  // MobileNav duplicates the nav links + auth actions, so these assertions are
  // scoped to the desktop nav (data-testid="desktop-nav").
  const desktopNav = () => screen.getByTestId('desktop-nav');

  beforeEach(() => {
    pathnameRef.current = '/about';
  });

  it('logged-out: shows a single SIGN IN, no MY PAGE / LOGOUT', () => {
    sessionRef.current = { data: null };
    render(<Header />);
    const nav = within(desktopNav());
    expect(nav.getAllByText('SIGN IN')).toHaveLength(1);
    expect(nav.queryByText('LOGOUT')).toBeNull();
    expect(nav.queryByText('MY PAGE')).toBeNull();
  });

  it('logged-in: shows a single MY PAGE + LOGOUT, no SIGN IN', () => {
    sessionRef.current = { data: { user: { email: 'a@b.com' } } };
    render(<Header />);
    const nav = within(desktopNav());
    expect(nav.getAllByText('MY PAGE')).toHaveLength(1);
    expect(nav.getAllByText('LOGOUT')).toHaveLength(1);
    expect(nav.queryByText('SIGN IN')).toBeNull();
  });

  it('renders the primary nav links once each', () => {
    sessionRef.current = { data: null };
    render(<Header />);
    const nav = within(desktopNav());
    expect(nav.getAllByText('DREAM HOTELS')).toHaveLength(1);
    expect(nav.getAllByText('MORE DREAMS')).toHaveLength(1);
    expect(nav.getAllByText('SIGNATURE JOURNEYS')).toHaveLength(1);
    expect(nav.getAllByText('CONCIERGE')).toHaveLength(1);
    expect(nav.getAllByText('MAGAZINE')).toHaveLength(1);
    expect(nav.getAllByText('ABOUT')).toHaveLength(1);
  });

  it('orders the nav: Dream Hotels, More Dreams, Signature Journeys, Concierge, Magazine, About', () => {
    sessionRef.current = { data: null };
    render(<Header />);
    const labels = Array.from(
      desktopNav().querySelectorAll(
        'a[href^="/dream-hotels"], a[href^="/more-dreams"], a[href^="/signature-journeys"], a[href^="/concierge"], a[href^="/magazine"], a[href^="/about"]',
      ),
    ).map((a) => a.textContent);
    expect(labels).toEqual([
      'DREAM HOTELS',
      'MORE DREAMS',
      'SIGNATURE JOURNEYS',
      'CONCIERGE',
      'MAGAZINE',
      'ABOUT',
    ]);
  });

  it('points the Magazine link at /magazine', () => {
    sessionRef.current = { data: null };
    render(<Header />);
    const link = within(desktopNav()).getByText('MAGAZINE').closest('a');
    expect(link?.getAttribute('href')).toBe('/magazine');
  });

  it('points the Signature Journeys link at /signature-journeys', () => {
    sessionRef.current = { data: null };
    render(<Header />);
    const link = within(desktopNav()).getByText('SIGNATURE JOURNEYS').closest('a');
    expect(link?.getAttribute('href')).toBe('/signature-journeys');
  });
});

describe('Header — Signature Journeys active state', () => {
  it('highlights Signature Journeys on /signature-journeys (overlay variant)', () => {
    pathnameRef.current = '/signature-journeys';
    sessionRef.current = { data: null };
    render(<Header />);
    const desktop = within(screen.getByTestId('desktop-nav'));
    const link = desktop.getByText('SIGNATURE JOURNEYS');
    // overlay active state = solid white + semibold
    expect(link.className).toContain('text-white');
    expect(link.className).toContain('font-semibold');
    // sibling nav items are not in their active state
    expect(desktop.getByText('MORE DREAMS').className).toContain('text-white/70');
  });
});

describe('Header — Magazine active state', () => {
  it('highlights Magazine on /magazine (app variant)', () => {
    pathnameRef.current = '/magazine';
    sessionRef.current = { data: null };
    render(<Header />);
    const desktop = within(screen.getByTestId('desktop-nav'));
    const link = desktop.getByText('MAGAZINE');
    expect(link.className).toContain('text-green-dark');
    // app variant → light bar, logo not inverted
    const logo = screen.getByAltText('TiP') as HTMLImageElement;
    expect(logo.style.filter).toBe('');
  });

  it('highlights Magazine on an article route /magazine/guide/some-slug', () => {
    pathnameRef.current = '/magazine/guide/some-slug';
    sessionRef.current = { data: null };
    render(<Header />);
    const link = within(screen.getByTestId('desktop-nav')).getByText('MAGAZINE');
    expect(link.className).toContain('text-green-dark');
  });
});

describe('Header — variant + SubNav driven by pathname', () => {
  it('overlay variant on / renders an inverted logo and no SubNav', () => {
    pathnameRef.current = '/';
    sessionRef.current = { data: null };
    render(<Header />);
    const logo = screen.getByAltText('TiP') as HTMLImageElement;
    expect(logo.style.filter).toContain('invert(1)');
    expect(screen.queryByText('Upcoming Travels')).toBeNull();
  });

  it('app variant on a /my-page subsection renders the SubNav with the right tab', () => {
    pathnameRef.current = '/my-page/credits';
    sessionRef.current = { data: { user: { email: 'a@b.com' } } };
    render(<Header />);
    // Header logo is NOT inverted in app variant
    const logo = screen.getByAltText('TiP') as HTMLImageElement;
    expect(logo.style.filter).toBe('');
    // SubNav present with all tabs; Credits is the active one
    expect(screen.getByText('Credits')).toBeDefined();
    expect(screen.getByText('Upcoming Travels')).toBeDefined();
    const credits = screen.getByText('Credits');
    expect(credits.className).toContain('font-bold');
  });

  it('app variant on /hotel/* highlights Dream Hotels and shows no SubNav', () => {
    pathnameRef.current = '/hotel/679';
    sessionRef.current = { data: null };
    render(<Header />);
    expect(screen.queryByText('Upcoming Travels')).toBeNull();
    const dreamHotels = within(screen.getByTestId('desktop-nav')).getByText('DREAM HOTELS');
    expect(dreamHotels.className).toContain('text-green-dark');
  });
});

// SubNav (rendered by Header on /my-page/**) calls scrollIntoView on mount.
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

describe('Header — mobile hamburger + drawer', () => {
  beforeEach(() => {
    pathnameRef.current = '/about';
    sessionRef.current = { data: null };
  });

  it('renders a hamburger button labelled "Open menu"', () => {
    render(<Header />);
    expect(screen.getByRole('button', { name: 'Open menu' })).toBeDefined();
  });

  it('opens the drawer (translate-x-0) when the hamburger is clicked', () => {
    render(<Header />);
    const drawer = screen.getByTestId('mobile-nav-drawer');
    expect(drawer.className).toContain('translate-x-full');
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(drawer.className).toContain('translate-x-0');
  });

  it('closes the drawer when the X (Close menu) button is clicked', () => {
    render(<Header />);
    const drawer = screen.getByTestId('mobile-nav-drawer');
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(drawer.className).toContain('translate-x-0');
    fireEvent.click(screen.getByRole('button', { name: 'Close menu' }));
    expect(drawer.className).toContain('translate-x-full');
  });

  it('closes the drawer on backdrop click', () => {
    render(<Header />);
    const drawer = screen.getByTestId('mobile-nav-drawer');
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(drawer.className).toContain('translate-x-0');
    fireEvent.click(screen.getByTestId('mobile-nav-backdrop'));
    expect(drawer.className).toContain('translate-x-full');
  });

  it('closes the drawer on Escape', () => {
    render(<Header />);
    const drawer = screen.getByTestId('mobile-nav-drawer');
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(drawer.className).toContain('translate-x-0');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(drawer.className).toContain('translate-x-full');
  });

  it('locks body scroll while the drawer is open and restores it on close', () => {
    render(<Header />);
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(document.body.style.overflow).toBe('hidden');
    fireEvent.click(screen.getByRole('button', { name: 'Close menu' }));
    expect(document.body.style.overflow).not.toBe('hidden');
  });

  it('drawer shows MY PAGE + LOGOUT (not SIGN IN) when authenticated', () => {
    sessionRef.current = { data: { user: { email: 'a@b.com' } } };
    render(<Header />);
    const drawer = screen.getByTestId('mobile-nav-drawer');
    expect(drawer.textContent).toContain('MY PAGE');
    expect(drawer.textContent).toContain('LOGOUT');
    expect(drawer.textContent).not.toContain('SIGN IN');
  });
});
