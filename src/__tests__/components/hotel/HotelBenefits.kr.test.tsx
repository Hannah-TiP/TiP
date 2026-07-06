import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import kr from '@/translations/kr.json';
import HotelBenefits from '@/components/hotel/HotelBenefits';
import type { HotelBenefitProgram } from '@/types/hotel';

const krCatalog = kr as Record<string, string>;

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    lang: 'kr' as const,
    setLang: vi.fn(),
    t: (key: string) => krCatalog[key] ?? key,
  }),
  LanguageProvider: ({ children }: { children: React.ReactNode }) => children,
}));

afterEach(() => cleanup());

describe('HotelBenefits (KR)', () => {
  it('renders the Korean benefit strings under the KR toggle', () => {
    const benefits: HotelBenefitProgram[] = [
      {
        program_name: 'Virtuoso',
        benefits: [
          { en: 'Daily breakfast for two', kr: '2인 조식 매일 제공' },
          { en: 'Room upgrade on arrival', kr: '체크인 시 객실 업그레이드' },
        ],
      },
    ];

    render(<HotelBenefits benefits={benefits} />);

    const items = screen.getAllByRole('listitem');
    expect(items.map((li) => li.textContent)).toEqual([
      '2인 조식 매일 제공',
      '체크인 시 객실 업그레이드',
    ]);
    expect(screen.queryByText('Daily breakfast for two')).toBeNull();
  });
});
