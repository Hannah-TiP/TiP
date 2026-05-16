import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

type LangValue = 'en' | 'kr';
let currentLang: LangValue = 'en';

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    lang: currentLang,
    setLang: (l: LangValue) => {
      currentLang = l;
    },
    t: (key: string) => key,
  }),
}));

vi.mock('next-auth/react', () => ({
  useSession: () => ({ status: 'unauthenticated', data: null }),
}));

vi.mock('@/components/TopBar', () => ({
  default: () => <div>TopBar</div>,
}));

vi.mock('@/components/SubNav', () => ({
  default: () => <div>SubNav</div>,
}));

vi.mock('@/components/Footer', () => ({
  default: () => <div>Footer</div>,
}));

import MembershipPage from '@/app/my-page/membership/page';

afterEach(() => {
  cleanup();
  currentLang = 'en';
});

describe('Cénacle Seventh Night benefit', () => {
  it('renders the new EN copy in the Cénacle "Access that cannot be bought" section', () => {
    currentLang = 'en';
    render(<MembershipPage />);

    expect(
      screen.getByText(
        'The Seventh Night — on bookings of seven or more nights at any TiP partner hotel, the seventh night is on us.',
      ),
    ).toBeDefined();

    // Confirm the new item lives in the section we expect.
    expect(screen.getByText('Access that cannot be bought')).toBeDefined();
  });

  it('renders the new KR copy when the language is Korean', () => {
    currentLang = 'kr';
    render(<MembershipPage />);

    expect(
      screen.getByText(
        '일곱 번째 밤 — TiP 파트너 호텔에서 7박 이상 투숙 시, 일곱 번째 밤은 무료로 제공됩니다.',
      ),
    ).toBeDefined();
  });

  it('places "The Seventh Night" immediately after "Private Stay Credit" in the Cénacle section', () => {
    currentLang = 'en';
    render(<MembershipPage />);

    const items = screen.getAllByText(/—/).map((el) => el.textContent ?? '');
    const privateStayIdx = items.findIndex((t) => t.startsWith('Private Stay Credit'));
    const seventhNightIdx = items.findIndex((t) => t.startsWith('The Seventh Night'));
    const emptyRoomIdx = items.findIndex((t) => t.startsWith('The Empty Room Guarantee'));

    expect(privateStayIdx).toBeGreaterThanOrEqual(0);
    expect(seventhNightIdx).toBe(privateStayIdx + 1);
    expect(emptyRoomIdx).toBe(seventhNightIdx + 1);
  });
});
