import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import BookingCard from '@/components/hotel/BookingCard';
import enTranslations from '@/translations/en.json';
import type { BenefitGroup } from '@/lib/hotel-benefits';

const group = (
  name: string | null,
  items: string[],
  eligibility: string | null = null,
): BenefitGroup => ({ name, eligibility, items });

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => (enTranslations as Record<string, string>)[key] ?? key,
    lang: 'en',
    setLang: () => {},
  }),
}));

afterEach(() => cleanup());

interface RenderOpts {
  benefitGroups?: BenefitGroup[];
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  kids?: number;
  errorMessage?: string | null;
  isSubmitting?: boolean;
  onSubmitRequest?: () => void;
  onAsk?: () => void;
  onCheckInChange?: (v: string) => void;
  onCheckOutChange?: (v: string) => void;
  onAdultsChange?: (v: number) => void;
  onKidsChange?: (v: number) => void;
}

function renderCard(opts: RenderOpts = {}) {
  const onSubmitRequest = opts.onSubmitRequest ?? vi.fn();
  const onAsk = opts.onAsk ?? vi.fn();
  const onCheckInChange = opts.onCheckInChange ?? vi.fn();
  const onCheckOutChange = opts.onCheckOutChange ?? vi.fn();
  const onAdultsChange = opts.onAdultsChange ?? vi.fn();
  const onKidsChange = opts.onKidsChange ?? vi.fn();
  render(
    <BookingCard
      hotelName="Aman Tokyo"
      benefitGroups={opts.benefitGroups ?? [group('Virtuoso', ['Breakfast for two'])]}
      checkIn={opts.checkIn ?? ''}
      checkOut={opts.checkOut ?? ''}
      adults={opts.adults ?? 2}
      kids={opts.kids ?? 0}
      onCheckInChange={onCheckInChange}
      onCheckOutChange={onCheckOutChange}
      onAdultsChange={onAdultsChange}
      onKidsChange={onKidsChange}
      onSubmitRequest={onSubmitRequest}
      onAskConcierge={onAsk}
      errorMessage={opts.errorMessage ?? null}
      isSubmitting={opts.isSubmitting}
    />,
  );
  return {
    onSubmitRequest,
    onAsk,
    onCheckInChange,
    onCheckOutChange,
    onAdultsChange,
    onKidsChange,
  };
}

describe('BookingCard', () => {
  it('renders title, all benefits, and both CTAs (Submit Request + Ask Concierge)', () => {
    renderCard({ benefitGroups: [group('Virtuoso', ['Breakfast for two', 'Priority upgrade'])] });

    expect(screen.getByText(/Aman Tokyo/)).toBeTruthy();
    expect(screen.getByText('Breakfast for two')).toBeTruthy();
    expect(screen.getByText('Priority upgrade')).toBeTruthy();
    expect(screen.getByRole('button', { name: /submit request/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /ask concierge/i })).toBeTruthy();
  });

  it('renders the adults/kids steppers with the supplied values', () => {
    renderCard({ adults: 3, kids: 1 });

    expect(screen.getByTestId('booking-card-hotel-booking-adults-value').textContent).toBe('3');
    expect(screen.getByTestId('booking-card-hotel-booking-kids-value').textContent).toBe('1');
  });

  it('invokes the submit-request and concierge callbacks when CTAs are clicked', () => {
    const { onSubmitRequest, onAsk } = renderCard();

    fireEvent.click(screen.getByRole('button', { name: /submit request/i }));
    fireEvent.click(screen.getByRole('button', { name: /ask concierge/i }));

    expect(onSubmitRequest).toHaveBeenCalledTimes(1);
    expect(onAsk).toHaveBeenCalledTimes(1);
  });

  it('renders one group per program with the program name and validity on the heading (SMA-467)', () => {
    renderCard({
      benefitGroups: [
        group('Virtuoso Amenities', ['Daily breakfast', 'Room upgrade'], 'valid Jan–Dec'),
        group('Suite Sojourn', ['USD 100 credit'], 'valid Oct–Dec'),
        group(null, ['Late checkout']),
      ],
    });

    const groups = screen.getAllByTestId('benefit-program-group');
    expect(groups).toHaveLength(3);
    expect(groups[0].textContent).toContain('Virtuoso Amenities');
    expect(groups[0].textContent).toContain('(valid Jan–Dec)');
    expect(groups[1].textContent).toContain('Suite Sojourn');
    // Bullets stay clean — the label lives on the heading, not on each bullet.
    expect(screen.getByText('Daily breakfast').textContent).toBe('Daily breakfast');
    // An unnamed program renders bullets with no heading.
    expect(groups[2].querySelector('p')).toBeNull();
    expect(groups[2].textContent).toContain('Late checkout');
  });

  it('omits the benefits panel when there are no benefit groups', () => {
    renderCard({ benefitGroups: [] });

    expect(screen.queryByText(/TiP exclusive benefits/i)).toBeNull();
  });

  it('does not render the trust badges row (SMA-63)', () => {
    renderCard();

    expect(screen.queryByText(/secure payment/i)).toBeNull();
    expect(screen.queryByText(/free cancellation/i)).toBeNull();
    expect(screen.queryByText(/korean support/i)).toBeNull();
  });

  it('renders the error message inline when one is provided', () => {
    renderCard({ errorMessage: 'Please select both check-in and check-out dates.' });

    const alert = screen.getByTestId('booking-card-error');
    expect(alert.textContent).toBe('Please select both check-in and check-out dates.');
    expect(alert.className).toMatch(/text-red-600/);
  });

  it('disables both CTAs while submitting', () => {
    const { onSubmitRequest, onAsk } = renderCard({ isSubmitting: true });

    const submitBtn = screen.getByRole('button', { name: /submit request/i }) as HTMLButtonElement;
    const askBtn = screen.getByRole('button', { name: /ask concierge/i }) as HTMLButtonElement;
    expect(submitBtn.disabled).toBe(true);
    expect(askBtn.disabled).toBe(true);

    fireEvent.click(submitBtn);
    fireEvent.click(askBtn);
    expect(onSubmitRequest).not.toHaveBeenCalled();
    expect(onAsk).not.toHaveBeenCalled();
  });

  it('forwards date input changes to the parent handlers', () => {
    const { onCheckInChange, onCheckOutChange } = renderCard();

    fireEvent.change(screen.getByLabelText(/check in/i), { target: { value: '2026-06-10' } });
    fireEvent.change(screen.getByLabelText(/check out/i), { target: { value: '2026-06-13' } });

    expect(onCheckInChange).toHaveBeenCalledWith('2026-06-10');
    expect(onCheckOutChange).toHaveBeenCalledWith('2026-06-13');
  });

  it('forwards adults/kids stepper changes to the parent handlers', () => {
    const { onAdultsChange, onKidsChange } = renderCard({ adults: 2, kids: 0 });

    fireEvent.click(screen.getByRole('button', { name: /increase adults/i }));
    expect(onAdultsChange).toHaveBeenCalledWith(3);

    fireEvent.click(screen.getByRole('button', { name: /increase kids/i }));
    expect(onKidsChange).toHaveBeenCalledWith(1);
  });

  it('disables the adults decrement at the floor (1) and the kids decrement at zero', () => {
    renderCard({ adults: 1, kids: 0 });

    const adultsDec = screen.getByRole('button', {
      name: /decrease adults/i,
    }) as HTMLButtonElement;
    const kidsDec = screen.getByRole('button', { name: /decrease kids/i }) as HTMLButtonElement;
    expect(adultsDec.disabled).toBe(true);
    expect(kidsDec.disabled).toBe(true);
  });

  it('disables increment buttons at the upper bounds', () => {
    renderCard({ adults: 20, kids: 10 });

    const adultsInc = screen.getByRole('button', {
      name: /increase adults/i,
    }) as HTMLButtonElement;
    const kidsInc = screen.getByRole('button', { name: /increase kids/i }) as HTMLButtonElement;
    expect(adultsInc.disabled).toBe(true);
    expect(kidsInc.disabled).toBe(true);
  });
});
