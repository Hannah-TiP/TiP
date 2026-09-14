import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import enTranslations from '@/translations/en.json';
import PointsWalletPanel from '@/components/quote/PointsWalletPanel';
import type { QuoteVersion, QuoteWalletSummary } from '@/types/quote';

const getSummaryMock = vi.fn();
const applyMock = vi.fn();
const removeMock = vi.fn();

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    getQuoteWalletSummary: (quoteId: number, language?: string) =>
      getSummaryMock(quoteId, language),
    applyQuotePoints: (quoteId: number, points?: number, language?: string) =>
      applyMock(quoteId, points, language),
    removeQuotePoints: (quoteId: number, language?: string) => removeMock(quoteId, language),
  },
}));

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => (enTranslations as Record<string, string>)[key] ?? key,
    lang: 'en',
    setLang: () => {},
  }),
}));

const baseSummary: QuoteWalletSummary = {
  balance_points: 20000,
  available_points: 18000,
  cap_points: 2500,
  cap_rate: '0.05',
  max_applicable_points: 2500,
  applied_points: 0,
  currency: 'USD',
  applied_amount: '0.00',
  max_applicable_amount: '25.00',
};

function version(overrides: Partial<QuoteVersion> = {}): QuoteVersion {
  return {
    id: 100,
    quote_id: 42,
    version_number: 1,
    line_items: [],
    total_snapshot: {
      currency: 'USD',
      subtotal: '500.00',
      fees: [],
      discounts: [],
      total: '500.00',
    },
    applied_points: 0,
    schema_version: 1,
    ...overrides,
  };
}

const appliedVersion = version({
  applied_points: 2500,
  total_snapshot: {
    currency: 'USD',
    subtotal: '500.00',
    fees: [],
    discounts: [{ label: 'Stay credit (2,500 P)', amount: '25.00', kind: 'stay_credit' }],
    total: '475.00',
  },
});

beforeEach(() => {
  getSummaryMock.mockReset().mockResolvedValue(baseSummary);
  applyMock.mockReset();
  removeMock.mockReset();
});

afterEach(() => {
  cleanup();
});

describe('PointsWalletPanel', () => {
  it('shows the wallet balance and max applicable, defaulting the input to max', async () => {
    render(
      <PointsWalletPanel
        quoteId={42}
        currentVersion={version()}
        status="SENT"
        onApplied={vi.fn()}
        onError={vi.fn()}
      />,
    );

    expect(await screen.findByTestId('wallet-balance')).toHaveTextContent('20,000 P');
    expect(screen.getByTestId('wallet-max')).toHaveTextContent('2,500 P');
    expect((screen.getByTestId('points-input') as HTMLInputElement).value).toBe('2500');
  });

  it('applies the chosen (partial) amount and reports the new bundle', async () => {
    const newBundle = { quote: { id: 42, status: 'SENT' }, current_version: appliedVersion };
    applyMock.mockResolvedValueOnce(newBundle);
    const onApplied = vi.fn();

    render(
      <PointsWalletPanel
        quoteId={42}
        currentVersion={version()}
        status="SENT"
        onApplied={onApplied}
        onError={vi.fn()}
      />,
    );

    const input = await screen.findByTestId('points-input');
    fireEvent.change(input, { target: { value: '1000' } });
    fireEvent.click(screen.getByTestId('apply-points-button'));

    await waitFor(() => expect(applyMock).toHaveBeenCalledWith(42, 1000, 'en'));
    expect(onApplied).toHaveBeenCalledWith(newBundle);
  });

  it('blocks invalid and over-max amounts client-side', async () => {
    render(
      <PointsWalletPanel
        quoteId={42}
        currentVersion={version()}
        status="SENT"
        onApplied={vi.fn()}
        onError={vi.fn()}
      />,
    );

    const input = await screen.findByTestId('points-input');

    fireEvent.change(input, { target: { value: '0' } });
    expect(screen.getByTestId('points-input-error')).toHaveTextContent(/at least 1 P/);
    expect(screen.getByTestId('apply-points-button')).toBeDisabled();

    fireEvent.change(input, { target: { value: '9999999' } });
    expect(screen.getByTestId('points-input-error')).toHaveTextContent(/up to 2,500 P/);
    expect(screen.getByTestId('apply-points-button')).toBeDisabled();
    expect(applyMock).not.toHaveBeenCalled();
  });

  it('surfaces the server message when the apply is rejected', async () => {
    applyMock.mockRejectedValueOnce(new Error('You can apply up to 1,000 P to this booking.'));
    const onError = vi.fn();

    render(
      <PointsWalletPanel
        quoteId={42}
        currentVersion={version()}
        status="SENT"
        onApplied={vi.fn()}
        onError={onError}
      />,
    );

    fireEvent.click(await screen.findByTestId('apply-points-button'));
    await waitFor(() =>
      expect(onError).toHaveBeenCalledWith('You can apply up to 1,000 P to this booking.'),
    );
  });

  it('shows the applied line with a Remove action and removes on click', async () => {
    const restoredBundle = { quote: { id: 42, status: 'SENT' }, current_version: version() };
    removeMock.mockResolvedValueOnce(restoredBundle);
    const onApplied = vi.fn();

    render(
      <PointsWalletPanel
        quoteId={42}
        currentVersion={appliedVersion}
        status="SENT"
        onApplied={onApplied}
        onError={vi.fn()}
      />,
    );

    const applied = await screen.findByTestId('applied-credit');
    expect(applied).toHaveTextContent('2,500 P applied');
    expect(applied).toHaveTextContent('25.00');

    fireEvent.click(screen.getByTestId('remove-points-button'));
    await waitFor(() => expect(removeMock).toHaveBeenCalledWith(42, 'en'));
    expect(onApplied).toHaveBeenCalledWith(restoredBundle);
  });

  it('shows the no-points message when nothing is applicable', async () => {
    getSummaryMock.mockResolvedValue({
      ...baseSummary,
      balance_points: 0,
      available_points: 0,
      max_applicable_points: 0,
      max_applicable_amount: '0.00',
    });

    render(
      <PointsWalletPanel
        quoteId={42}
        currentVersion={version()}
        status="SENT"
        onApplied={vi.fn()}
        onError={vi.fn()}
      />,
    );

    expect(await screen.findByTestId('no-points')).toBeInTheDocument();
    expect(screen.queryByTestId('apply-points-button')).not.toBeInTheDocument();
  });

  it('renders nothing on a locked quote with no applied points', () => {
    const { container } = render(
      <PointsWalletPanel
        quoteId={42}
        currentVersion={version()}
        status="PAID"
        onApplied={vi.fn()}
        onError={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
    expect(getSummaryMock).not.toHaveBeenCalled();
  });

  it('shows the applied line read-only (no fetch, no controls) on a PAID quote', () => {
    render(
      <PointsWalletPanel
        quoteId={42}
        currentVersion={appliedVersion}
        status="PAID"
        onApplied={vi.fn()}
        onError={vi.fn()}
      />,
    );

    expect(screen.getByTestId('applied-credit')).toHaveTextContent('2,500 P applied');
    expect(screen.queryByTestId('remove-points-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('points-input')).not.toBeInTheDocument();
    expect(getSummaryMock).not.toHaveBeenCalled();
  });

  it('quotes the live cap rate in the hint (SMA-359) — from cap_rate, never a literal', async () => {
    getSummaryMock.mockResolvedValue({ ...baseSummary, cap_rate: '0.07' });

    render(
      <PointsWalletPanel
        quoteId={42}
        currentVersion={version()}
        status="SENT"
        onApplied={vi.fn()}
        onError={vi.fn()}
      />,
    );

    await screen.findByTestId('wallet-balance');
    expect(screen.getByTestId('points-hint')).toHaveTextContent(
      'Up to 7% of this booking can be paid with points.',
    );
  });

  it('keeps the generic hint when the summary carries no cap_rate', async () => {
    getSummaryMock.mockResolvedValue({ ...baseSummary, cap_rate: '' });

    render(
      <PointsWalletPanel
        quoteId={42}
        currentVersion={version()}
        status="SENT"
        onApplied={vi.fn()}
        onError={vi.fn()}
      />,
    );

    await screen.findByTestId('wallet-balance');
    expect(screen.getByTestId('points-hint')).toHaveTextContent(
      'Use your points to reduce what you pay for this booking. A per-booking limit applies.',
    );
  });

  it('shows the generic hint on a locked quote (no wallet fetch, so no cap rate)', () => {
    render(
      <PointsWalletPanel
        quoteId={42}
        currentVersion={appliedVersion}
        status="PAID"
        onApplied={vi.fn()}
        onError={vi.fn()}
      />,
    );

    expect(screen.getByTestId('points-hint')).toHaveTextContent(/A per-booking limit applies/);
  });
});
