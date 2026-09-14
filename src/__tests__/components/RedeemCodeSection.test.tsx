import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import enTranslations from '@/translations/en.json';
import RedeemCodeSection from '@/components/credits/RedeemCodeSection';
import { RedeemPromoCodeError } from '@/types/stay-credit';

const redeemMock = vi.fn();

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    redeemPromoCode: (code: string) => redeemMock(code),
  },
}));

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => (enTranslations as Record<string, string>)[key] ?? key,
    lang: 'en',
    setLang: () => {},
  }),
}));

beforeEach(() => {
  redeemMock.mockReset();
});

afterEach(() => {
  cleanup();
});

describe('RedeemCodeSection', () => {
  it('disables submit until a code is entered', () => {
    render(<RedeemCodeSection onRedeemed={vi.fn()} pointUnit={100} />);
    const submit = screen.getByTestId('redeem-code-submit') as HTMLButtonElement;
    expect(submit.disabled).toBe(true);

    fireEvent.change(screen.getByTestId('redeem-code-input'), {
      target: { value: 'LOTTE-VIP' },
    });
    expect(submit.disabled).toBe(false);
  });

  it('shows the credited points and notifies the parent on success', async () => {
    redeemMock.mockResolvedValueOnce({
      credited_amount: '150.00',
      currency: 'EUR',
      credit_id: 9,
      credited_points: 16500,
    });
    const onRedeemed = vi.fn();
    render(<RedeemCodeSection onRedeemed={onRedeemed} pointUnit={100} />);

    fireEvent.change(screen.getByTestId('redeem-code-input'), {
      target: { value: 'LOTTE-VIP' },
    });
    fireEvent.click(screen.getByTestId('redeem-code-submit'));

    const success = await screen.findByTestId('redeem-code-success');
    // The wallet unit is P — `credited_points` wins over the EUR amount.
    expect(success.textContent).toBe('16,500 P added to your TiP Points.');
    expect(success.textContent).not.toContain('€');
    expect(redeemMock).toHaveBeenCalledWith('LOTTE-VIP');
    await waitFor(() => expect(onRedeemed).toHaveBeenCalledTimes(1));
    // Input is cleared after a successful redemption.
    expect((screen.getByTestId('redeem-code-input') as HTMLInputElement).value).toBe('');
  });

  it('falls back to the USD amount via the point unit when credited_points is absent', async () => {
    redeemMock.mockResolvedValueOnce({ credited_amount: '20.00', currency: 'USD', credit_id: 9 });
    render(<RedeemCodeSection onRedeemed={vi.fn()} pointUnit={100} />);

    fireEvent.change(screen.getByTestId('redeem-code-input'), { target: { value: 'X' } });
    fireEvent.click(screen.getByTestId('redeem-code-submit'));

    const success = await screen.findByTestId('redeem-code-success');
    expect(success.textContent).toBe('2,000 P added to your TiP Points.');
    expect(success.textContent).not.toContain('$');
  });

  it('shows the generic success without a figure for a non-USD legacy response', async () => {
    redeemMock.mockResolvedValueOnce({ credited_amount: '20.00', currency: 'EUR', credit_id: 9 });
    render(<RedeemCodeSection onRedeemed={vi.fn()} pointUnit={100} />);

    fireEvent.change(screen.getByTestId('redeem-code-input'), { target: { value: 'X' } });
    fireEvent.click(screen.getByTestId('redeem-code-submit'));

    const success = await screen.findByTestId('redeem-code-success');
    expect(success.textContent).toBe(
      (enTranslations as Record<string, string>)['credits.redeem_success_no_figure'],
    );
    expect(success.textContent).not.toContain('20');
  });

  it.each([
    ['already_redeemed', 'credits.redeem_error_already_redeemed'],
    ['expired', 'credits.redeem_error_expired'],
    ['inactive', 'credits.redeem_error_inactive'],
    ['max_reached', 'credits.redeem_error_max_reached'],
    ['unknown', 'credits.redeem_error_unknown'],
  ])('renders the distinct message for the "%s" error', async (code, key) => {
    redeemMock.mockRejectedValueOnce(new RedeemPromoCodeError(code as never, 'backend message'));
    const onRedeemed = vi.fn();
    render(<RedeemCodeSection onRedeemed={onRedeemed} pointUnit={100} />);

    fireEvent.change(screen.getByTestId('redeem-code-input'), {
      target: { value: 'SOME-CODE' },
    });
    fireEvent.click(screen.getByTestId('redeem-code-submit'));

    const error = await screen.findByTestId('redeem-code-error');
    expect(error.textContent).toBe((enTranslations as Record<string, string>)[key]);
    expect(onRedeemed).not.toHaveBeenCalled();
  });

  it('falls back to the generic error for an unexpected throw', async () => {
    redeemMock.mockRejectedValueOnce(new Error('network'));
    render(<RedeemCodeSection onRedeemed={vi.fn()} pointUnit={100} />);

    fireEvent.change(screen.getByTestId('redeem-code-input'), {
      target: { value: 'X' },
    });
    fireEvent.click(screen.getByTestId('redeem-code-submit'));

    const error = await screen.findByTestId('redeem-code-error');
    expect(error.textContent).toBe(
      (enTranslations as Record<string, string>)['credits.redeem_error_generic'],
    );
  });
});
