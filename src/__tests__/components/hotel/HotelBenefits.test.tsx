import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import HotelBenefits from '@/components/hotel/HotelBenefits';
import enTranslations from '@/translations/en.json';
import type { HotelBenefitProgram } from '@/types/hotel';

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => (enTranslations as Record<string, string>)[key] ?? key,
    lang: 'en',
    setLang: () => {},
  }),
}));

afterEach(() => cleanup());

describe('HotelBenefits', () => {
  it('renders one group per program — program name heading, then that program’s bullets (SMA-467)', () => {
    const benefits: HotelBenefitProgram[] = [
      {
        program_name: { en: 'Virtuoso' },
        benefits: [{ en: 'Daily breakfast for two' }, { en: 'Room upgrade on arrival' }],
      },
      {
        program_name: { en: 'Marriott STARS' },
        benefits: [{ en: '$100 property credit' }],
      },
    ];

    render(<HotelBenefits benefits={benefits} />);

    expect(
      screen.getByText((content) =>
        content.includes(enTranslations['hotel.booking_benefits_title']),
      ),
    ).toBeTruthy();
    const groups = screen.getAllByTestId('benefit-program-group');
    expect(groups).toHaveLength(2);
    expect(groups[0].querySelector('p')?.textContent).toBe('Virtuoso');
    expect(groups[1].querySelector('p')?.textContent).toBe('Marriott STARS');
    const items = screen.getAllByRole('listitem');
    expect(items.map((li) => li.textContent)).toEqual([
      'Daily breakfast for two',
      'Room upgrade on arrival',
      '$100 property credit',
    ]);
  });

  it('puts the validity label on the program heading, not on the bullets', () => {
    const benefits: HotelBenefitProgram[] = [
      {
        program_name: { en: 'Winter Special' },
        valid_from: '2020-10-01',
        valid_until: '2020-12-27',
        benefits: [{ en: '3rd night free' }],
      },
    ];

    render(<HotelBenefits benefits={benefits} />);

    const heading = screen.getByTestId('benefit-program-group').querySelector('p');
    expect(heading?.textContent).toContain('Winter Special');
    expect(heading?.textContent).toMatch(/valid Oct–Dec 2020/);
    expect(screen.getByRole('listitem').textContent).toBe('3rd night free');
  });

  it('renders an unnamed program as bullets with no heading', () => {
    const benefits: HotelBenefitProgram[] = [{ benefits: [{ en: 'Late checkout' }] }];

    render(<HotelBenefits benefits={benefits} />);

    expect(screen.getByTestId('benefit-program-group').querySelector('p')).toBeNull();
    expect(screen.getByText('Late checkout')).toBeTruthy();
  });

  it('falls back to the Korean string when English is missing for a bullet', () => {
    const benefits: HotelBenefitProgram[] = [{ benefits: [{ kr: '조식 제공', en: null }] }];

    render(<HotelBenefits benefits={benefits} />);

    expect(screen.getByText('조식 제공')).toBeTruthy();
  });

  it('renders nothing when benefits is null', () => {
    const { container } = render(<HotelBenefits benefits={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when benefits is an empty array', () => {
    const { container } = render(<HotelBenefits benefits={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when every benefit string is empty after localization', () => {
    const benefits: HotelBenefitProgram[] = [
      {
        benefits: [
          { en: '', kr: '' },
          { en: null, kr: null },
        ],
      },
    ];

    const { container } = render(<HotelBenefits benefits={benefits} />);
    expect(container.firstChild).toBeNull();
  });

  it('skips empty bullets but renders the non-empty ones', () => {
    const benefits: HotelBenefitProgram[] = [
      {
        benefits: [{ en: 'Welcome amenity' }, { en: '', kr: '' }, { en: 'Late checkout' }],
      },
    ];

    render(<HotelBenefits benefits={benefits} />);

    const items = screen.getAllByRole('listitem');
    expect(items.map((li) => li.textContent)).toEqual(['Welcome amenity', 'Late checkout']);
  });
});
