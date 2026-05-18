import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const pathnameRef: { current: string } = { current: '/' };
const sessionRef: { current: { data: unknown } } = { current: { data: null } };

vi.mock('next/navigation', () => ({
  usePathname: () => pathnameRef.current,
}));

vi.mock('next-auth/react', () => ({
  useSession: () => sessionRef.current,
  signOut: vi.fn(),
}));

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    lang: 'en' as const,
    setLang: vi.fn(),
    t: (key: string) => (key === 'nav.language_toggle' ? 'EN | KR' : key),
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

describe('Header — auth controls render exactly once', () => {
  beforeEach(() => {
    pathnameRef.current = '/insights';
  });

  it('logged-out: shows a single SIGN IN, no MY PAGE / LOGOUT', () => {
    sessionRef.current = { data: null };
    render(<Header />);
    expect(screen.getAllByText('SIGN IN')).toHaveLength(1);
    expect(screen.queryByText('LOGOUT')).toBeNull();
    expect(screen.queryByText('MY PAGE')).toBeNull();
  });

  it('logged-in: shows a single MY PAGE + LOGOUT, no SIGN IN', () => {
    sessionRef.current = { data: { user: { email: 'a@b.com' } } };
    render(<Header />);
    expect(screen.getAllByText('MY PAGE')).toHaveLength(1);
    expect(screen.getAllByText('LOGOUT')).toHaveLength(1);
    expect(screen.queryByText('SIGN IN')).toBeNull();
  });

  it('renders the primary nav links once each', () => {
    sessionRef.current = { data: null };
    render(<Header />);
    expect(screen.getAllByText('DREAM HOTELS')).toHaveLength(1);
    expect(screen.getAllByText('MORE DREAMS')).toHaveLength(1);
    expect(screen.getAllByText('INSIGHTS')).toHaveLength(1);
    expect(screen.getAllByText('CONCIERGE')).toHaveLength(1);
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
    const dreamHotels = screen.getByText('DREAM HOTELS');
    expect(dreamHotels.className).toContain('text-green-dark');
  });
});
