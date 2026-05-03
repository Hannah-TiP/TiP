import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import BookingCard from '@/components/hotel/BookingCard';
import enTranslations from '@/translations/en.json';

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => (enTranslations as Record<string, string>)[key] ?? key,
    lang: 'en',
    setLang: () => {},
  }),
}));

afterEach(() => cleanup());

describe('BookingCard', () => {
  it('renders title, all benefits, and both CTAs', () => {
    const onReserve = vi.fn();
    const onAsk = vi.fn();
    render(
      <BookingCard
        hotelName="Aman Tokyo"
        benefits={['Breakfast for two', 'Priority upgrade']}
        onReserve={onReserve}
        onAskConcierge={onAsk}
      />,
    );

    expect(screen.getByText(/Aman Tokyo/)).toBeTruthy();
    expect(screen.getByText('Breakfast for two')).toBeTruthy();
    expect(screen.getByText('Priority upgrade')).toBeTruthy();
    expect(screen.getByRole('button', { name: /^reserve$/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /ask concierge/i })).toBeTruthy();
  });

  it('invokes the reserve and concierge callbacks when CTAs are clicked', () => {
    const onReserve = vi.fn();
    const onAsk = vi.fn();
    render(
      <BookingCard
        hotelName="Aman Tokyo"
        benefits={['Benefit A']}
        onReserve={onReserve}
        onAskConcierge={onAsk}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /^reserve$/i }));
    fireEvent.click(screen.getByRole('button', { name: /ask concierge/i }));

    expect(onReserve).toHaveBeenCalledTimes(1);
    expect(onAsk).toHaveBeenCalledTimes(1);
  });

  it('omits the benefits panel when the benefits array is empty', () => {
    render(
      <BookingCard
        hotelName="Aman Tokyo"
        benefits={[]}
        onReserve={() => {}}
        onAskConcierge={() => {}}
      />,
    );

    expect(screen.queryByText(/TiP exclusive benefits/i)).toBeNull();
  });
});
