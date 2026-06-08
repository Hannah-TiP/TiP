import type { AnchorHTMLAttributes } from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import enTranslations from '@/translations/en.json';
import { apiClient } from '@/lib/api-client';
import type { SharedTripDetail } from '@/types/trip-share';
import SharedTripDetailPage from '@/app/shared-trips/[id]/page';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: '9' }),
  useRouter: () => ({ push: pushMock, replace: vi.fn(), back: vi.fn() }),
}));

vi.mock('next-auth/react', () => ({
  useSession: () => ({ status: 'authenticated', data: null }),
}));

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => (enTranslations as Record<string, string>)[key] ?? key,
    lang: 'en',
    setLang: () => {},
  }),
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

vi.mock('@/components/Footer', () => ({ default: () => <div>Footer</div> }));

vi.mock('@/lib/api-client', () => ({
  apiClient: { getSharedTripDetail: vi.fn() },
}));

function baseDetail(overrides: Partial<SharedTripDetail> = {}): SharedTripDetail {
  return {
    trip_id: 9,
    status: 'ready-to-travel',
    show_cost: true,
    show_booking_documents: false,
    can_reshare: true,
    current_version: {
      trip_id: 9,
      title: 'Paris Getaway',
      start_date: '2026-09-01',
      end_date: '2026-09-05',
      adults: 2,
      kids: 0,
      plan: [],
      schema_version: 1,
    },
    active_quote: null,
    booking_documents: [],
    ...overrides,
  };
}

const getDetail = apiClient.getSharedTripDetail as ReturnType<typeof vi.fn>;

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('SharedTripDetailPage inline cost', () => {
  it('renders the inline total from active_quote without a /quotes link', async () => {
    getDetail.mockResolvedValue(
      baseDetail({
        active_quote: {
          quote: {
            id: 55,
            trip_id: 9,
            trip_version_id: 1,
            user_id: 1,
            current_quote_version_id: 7,
            status: 'SENT',
            schema_version: 1,
          },
          current_version: {
            id: 7,
            quote_id: 55,
            version_number: 1,
            line_items: [],
            total_snapshot: {
              currency: 'USD',
              subtotal: '1000.00',
              fees: [{ label: 'Service fee', amount: '50.00' }],
              discounts: [{ label: 'Promo', amount: '100.00' }],
              total: '950.00',
            },
            schema_version: 1,
          },
        },
      }),
    );

    const { container } = render(<SharedTripDetailPage />);

    await waitFor(() => {
      expect(screen.getByTestId('shared-quote')).toBeTruthy();
    });

    const quoteCard = screen.getByTestId('shared-quote');
    // Inline total/subtotal/fee/discount rendered.
    expect(quoteCard.textContent).toContain('$1,000.00'); // subtotal
    expect(quoteCard.textContent).toContain('$50.00'); // fee
    expect(quoteCard.textContent).toContain('$100.00'); // discount
    expect(quoteCard.textContent).toContain('$950.00'); // total
    // No owner-gated /quotes/{id} link anywhere on the page.
    expect(container.querySelector('a[href^="/quotes/"]')).toBeNull();
  });

  it('omits the cost card when no active quote is present', async () => {
    getDetail.mockResolvedValue(baseDetail({ show_cost: true, active_quote: null }));

    render(<SharedTripDetailPage />);

    await waitFor(() => {
      expect(screen.getAllByText('Paris Getaway').length).toBeGreaterThan(0);
    });

    expect(screen.queryByTestId('shared-quote')).toBeNull();
  });

  it('shows the cost-hidden note when show_cost is false', async () => {
    getDetail.mockResolvedValue(baseDetail({ show_cost: false, active_quote: null }));

    render(<SharedTripDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(enTranslations['shared_trip_detail.cost_hidden'])).toBeTruthy();
    });
    expect(screen.queryByTestId('shared-quote')).toBeNull();
  });
});
