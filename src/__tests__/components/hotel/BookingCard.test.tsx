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

interface RenderOpts {
  benefits?: string[];
  checkIn?: string;
  checkOut?: string;
  errorMessage?: string | null;
  isSubmitting?: boolean;
  onReserve?: () => void;
  onAsk?: () => void;
  onCheckInChange?: (v: string) => void;
  onCheckOutChange?: (v: string) => void;
}

function renderCard(opts: RenderOpts = {}) {
  const onReserve = opts.onReserve ?? vi.fn();
  const onAsk = opts.onAsk ?? vi.fn();
  const onCheckInChange = opts.onCheckInChange ?? vi.fn();
  const onCheckOutChange = opts.onCheckOutChange ?? vi.fn();
  render(
    <BookingCard
      hotelName="Aman Tokyo"
      benefits={opts.benefits ?? ['Breakfast for two']}
      checkIn={opts.checkIn ?? ''}
      checkOut={opts.checkOut ?? ''}
      onCheckInChange={onCheckInChange}
      onCheckOutChange={onCheckOutChange}
      onReserve={onReserve}
      onAskConcierge={onAsk}
      errorMessage={opts.errorMessage ?? null}
      isSubmitting={opts.isSubmitting}
    />,
  );
  return { onReserve, onAsk, onCheckInChange, onCheckOutChange };
}

describe('BookingCard', () => {
  it('renders title, all benefits, and both CTAs', () => {
    renderCard({ benefits: ['Breakfast for two', 'Priority upgrade'] });

    expect(screen.getByText(/Aman Tokyo/)).toBeTruthy();
    expect(screen.getByText('Breakfast for two')).toBeTruthy();
    expect(screen.getByText('Priority upgrade')).toBeTruthy();
    expect(screen.getByRole('button', { name: /^reserve$/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /ask concierge/i })).toBeTruthy();
  });

  it('invokes the reserve and concierge callbacks when CTAs are clicked', () => {
    const { onReserve, onAsk } = renderCard();

    fireEvent.click(screen.getByRole('button', { name: /^reserve$/i }));
    fireEvent.click(screen.getByRole('button', { name: /ask concierge/i }));

    expect(onReserve).toHaveBeenCalledTimes(1);
    expect(onAsk).toHaveBeenCalledTimes(1);
  });

  it('omits the benefits panel when the benefits array is empty', () => {
    renderCard({ benefits: [] });

    expect(screen.queryByText(/TiP exclusive benefits/i)).toBeNull();
  });

  it('renders the error message inline when one is provided', () => {
    renderCard({ errorMessage: 'Please select both check-in and check-out dates.' });

    const alert = screen.getByTestId('booking-card-error');
    expect(alert.textContent).toBe('Please select both check-in and check-out dates.');
    expect(alert.className).toMatch(/text-red-600/);
  });

  it('disables both CTAs while submitting', () => {
    const { onReserve, onAsk } = renderCard({ isSubmitting: true });

    const reserveBtn = screen.getByRole('button', { name: /^reserve$/i }) as HTMLButtonElement;
    const askBtn = screen.getByRole('button', { name: /ask concierge/i }) as HTMLButtonElement;
    expect(reserveBtn.disabled).toBe(true);
    expect(askBtn.disabled).toBe(true);

    fireEvent.click(reserveBtn);
    fireEvent.click(askBtn);
    expect(onReserve).not.toHaveBeenCalled();
    expect(onAsk).not.toHaveBeenCalled();
  });

  it('forwards date input changes to the parent handlers', () => {
    const { onCheckInChange, onCheckOutChange } = renderCard();

    fireEvent.change(screen.getByLabelText(/check in/i), { target: { value: '2026-06-10' } });
    fireEvent.change(screen.getByLabelText(/check out/i), { target: { value: '2026-06-13' } });

    expect(onCheckInChange).toHaveBeenCalledWith('2026-06-10');
    expect(onCheckOutChange).toHaveBeenCalledWith('2026-06-13');
  });
});
