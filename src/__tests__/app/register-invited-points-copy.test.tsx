/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-unused-vars */
import type { AnchorHTMLAttributes, ImgHTMLAttributes } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import RegisterPage from '@/app/register/page';
import en from '@/translations/en.json';
import type { BenefitsResponse } from '@/types/v2/benefits';

// The "Invited by CODE" banner quotes the registry's LARGEST
// `referral_joiner_credit` value as "up to {points}" — the joiner reward
// keys off the (unknown here) inviter's tier (SMA-358).

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams('ref=ABCD1234'),
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

vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
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

// `point_unit` (100 P = 1 USD) + the tiered joiner reward in USD cents:
// $50 at Carte/Cercle, $300 at Confidence/Cénacle ⇒ "up to 30,000 P".
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
      key: 'referral_joiner_credit',
      kind: 'one_off_grant',
      unit: 'usd_cents',
      values_by_tier: { carte: '5000', cercle: '5000', confidence: '30000', cenacle: '30000' },
      copy: { en: 'x', kr: 'x' },
    },
  ],
  resolved: null,
};

afterEach(() => {
  cleanup();
  benefitsValue = null;
});

describe('register page invited banner (SMA-358)', () => {
  it('quotes the largest joiner reward from the registry as "up to {points}"', async () => {
    benefitsValue = PAYLOAD;
    render(<RegisterPage />);

    const banner = (await screen.findByText('ABCD1234')).parentElement;
    expect(banner?.textContent).toBe(
      'Invited by ABCD1234 — up to 30,000 P in TiP Points will be added when you join.',
    );
    expect(banner?.textContent).not.toMatch(/credit/i);
  });

  it('drops the figure (never invents one) when the registry is unavailable', async () => {
    benefitsValue = null;
    render(<RegisterPage />);

    const banner = (await screen.findByText('ABCD1234')).parentElement;
    expect(banner?.textContent).toBe(`Invited by ABCD1234${en['register.invited_by_suffix']}`);
    expect(banner?.textContent).not.toMatch(/\d\s?P\b/);
  });
});
