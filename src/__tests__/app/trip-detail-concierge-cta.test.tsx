import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { TripWithVersion } from '@/lib/trip-utils';
import enTranslations from '@/translations/en.json';

const getTripWithVersion = vi.fn();
const getLatestQuoteForTrip = vi.fn();

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: '7' }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock('@/components/Footer', () => ({ default: () => <div>Footer</div> }));

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => (enTranslations as Record<string, string>)[key] ?? key,
    lang: 'en',
    setLang: () => {},
  }),
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    getLatestQuoteForTrip: (...a: unknown[]) => getLatestQuoteForTrip(...a),
  },
}));

vi.mock('@/lib/trip-utils', async () => {
  const actual = await vi.importActual<typeof import('@/lib/trip-utils')>('@/lib/trip-utils');
  return {
    ...actual,
    getTripWithVersion: (...a: unknown[]) => getTripWithVersion(...a),
  };
});

import TripDetailPage from '@/app/my-page/trip/[id]/page';

function makeTripWithVersion(status: string): TripWithVersion {
  return {
    trip: {
      id: 7,
      user_id: 1,
      status,
      current_trip_version_id: 1,
      schema_version: 1,
    },
    currentVersion: {
      id: 1,
      trip_id: 7,
      version_number: 1,
      title: 'Paris Trip',
      summary: 'Leisure',
      start_date: '2026-06-01',
      end_date: '2026-06-03',
      adults: 2,
      kids: 0,
      plan: [],
      schema_version: 1,
    },
    activeQuote: null,
  };
}

const conciergeLabel = (enTranslations as Record<string, string>)['trip_detail.edit_in_concierge'];

afterEach(() => {
  cleanup();
  getTripWithVersion.mockReset();
  getLatestQuoteForTrip.mockReset();
});

describe('TripDetailPage — Edit in Concierge sidebar CTA gating', () => {
  it('does NOT render the "Edit in Concierge" sidebar CTA for a canceled trip', async () => {
    getTripWithVersion.mockResolvedValue(makeTripWithVersion('canceled'));
    getLatestQuoteForTrip.mockResolvedValue(null);

    render(<TripDetailPage />);

    // Wait until the page has finished loading the trip (heading appears).
    await screen.findByRole('heading', { name: 'Paris Trip' });

    expect(screen.queryByRole('link', { name: conciergeLabel })).toBeNull();
  });

  it('renders the "Edit in Concierge" sidebar CTA for an active (paid) trip', async () => {
    getTripWithVersion.mockResolvedValue(makeTripWithVersion('paid'));
    getLatestQuoteForTrip.mockResolvedValue(null);

    render(<TripDetailPage />);

    await screen.findByRole('heading', { name: 'Paris Trip' });

    const link = await screen.findByRole('link', { name: conciergeLabel });
    expect(link.getAttribute('href')).toBe('/concierge?trip_id=7');
  });
});
