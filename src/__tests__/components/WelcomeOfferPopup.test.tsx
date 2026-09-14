import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import WelcomeOfferPopup from '@/components/WelcomeOfferPopup';
import en from '@/translations/en.json';
import type { BenefitsResponse } from '@/types/v2/benefits';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('next/image', () => ({
  default: ({ alt }: { alt: string }) => <span role="img" aria-label={alt} />,
}));

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    lang: 'en' as const,
    setLang: vi.fn(),
    t: (key: string) => (en as Record<string, string>)[key] ?? key,
  }),
}));

let benefitsValue: BenefitsResponse | null = null;
vi.mock('@/hooks/useBenefits', () => ({
  useBenefits: () => benefitsValue,
}));

// Registry payload with `point_unit` (100 P = 1 USD) and the flat
// `signup_welcome` grant ($100 in USD cents → 10,000 P).
const PAYLOAD: BenefitsResponse = {
  benefits: [
    {
      key: 'point_unit',
      kind: 'unit_definition',
      unit: 'points',
      values_by_tier: { carte: '100', cercle: '100', confidence: '100', cenacle: '100' },
      copy: { en: 'x', kr: 'x' },
    },
    {
      key: 'signup_welcome',
      kind: 'one_off_grant',
      unit: 'usd_cents',
      values_by_tier: { carte: '10000', cercle: '10000', confidence: '10000', cenacle: '10000' },
      copy: { en: 'x', kr: 'x' },
    },
  ],
  resolved: null,
};

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  benefitsValue = null;
});

async function renderOpen() {
  render(<WelcomeOfferPopup />);
  // The popup opens after a short delay.
  await act(async () => {
    vi.advanceTimersByTime(500);
  });
  return screen.getByTestId('welcome-offer-popup');
}

describe('WelcomeOfferPopup (SMA-358)', () => {
  it('reads the welcome grant figure in P from the registry signup_welcome entry', async () => {
    benefitsValue = PAYLOAD;

    const popup = await renderOpen();

    expect(screen.getByRole('link').textContent).toBe('Claim Your 10,000 P →');
    expect(popup.textContent).toContain('receive 10,000 P in TiP Points');
    // No currency-denominated "credit" claim survives.
    expect(popup.textContent).not.toMatch(/USD\s?\d/);
    expect(popup.textContent).not.toMatch(/credit/i);
  });

  it('drops the figure (never invents one) when the registry is unavailable', async () => {
    benefitsValue = null;

    const popup = await renderOpen();

    expect(screen.getByRole('link').textContent).toBe(en['welcome_offer.cta']);
    expect(popup.textContent).toContain(en['welcome_offer.body']);
    expect(popup.textContent).not.toMatch(/\d\s?P\b/);
  });
});
