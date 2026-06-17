import type { AnchorHTMLAttributes } from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MyPageUpcomingTravels from '@/app/my-page/page';
import { getTripsWithVersions, type TripWithVersion } from '@/lib/trip-utils';
import en from '@/translations/en.json';
import type { Trip } from '@/types/trip';

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

vi.mock('@/components/Footer', () => ({
  default: () => <div>Footer</div>,
}));

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    lang: 'en' as const,
    setLang: vi.fn(),
    t: (key: string) => (en as Record<string, string>)[key] ?? key,
  }),
}));

vi.mock('@/lib/trip-utils', () => ({
  getTripsWithVersions: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function bundle(id: number, status: string, title: string): TripWithVersion {
  const trip = {
    id,
    user_id: 1,
    status,
    schema_version: 1,
  } as unknown as Trip;
  return {
    trip,
    currentVersion: {
      id: id * 10,
      trip_id: id,
      adults: 2,
      kids: 0,
      title,
      start_date: '2026-07-01',
      end_date: '2026-07-05',
      schema_version: 1,
    },
    activeQuote: null,
  };
}

describe('MyPage canceled trips', () => {
  it('shows a canceled trip with the Canceled badge and excludes completed trips', async () => {
    vi.mocked(getTripsWithVersions).mockResolvedValue([
      bundle(1, 'in-progress', 'Active Trip'),
      bundle(2, 'canceled', 'Canceled Trip'),
      bundle(3, 'travel-completed', 'Completed Trip'),
    ]);

    render(<MyPageUpcomingTravels />);

    // Active trip renders in the hero slot (sorted first) -- the hero renders
    // its title in both the cover placeholder and the heading.
    expect((await screen.findAllByText('Active Trip')).length).toBeGreaterThan(0);
    // Canceled trip is present (sorts last -> grid card).
    const canceledTitle = screen.getByText('Canceled Trip');
    expect(canceledTitle).toBeTruthy();
    // The Canceled badge resolves from the i18n catalog.
    expect(screen.getByText('Canceled')).toBeTruthy();
    // The canceled card container is muted.
    expect(canceledTitle.closest('a')?.querySelector('.opacity-70.grayscale')).toBeTruthy();
    // Completed trips are routed to Travel History, not my-page.
    expect(screen.queryByText('Completed Trip')).toBeNull();
  });

  it('called the API without exclude_canceled so canceled trips are returned', async () => {
    vi.mocked(getTripsWithVersions).mockResolvedValue([bundle(1, 'in-progress', 'Active Trip')]);

    render(<MyPageUpcomingTravels />);

    await screen.findAllByText('Active Trip');
    await waitFor(() => {
      expect(vi.mocked(getTripsWithVersions)).toHaveBeenCalled();
    });
    const firstArg = vi.mocked(getTripsWithVersions).mock.calls[0]?.[0];
    expect(firstArg?.exclude_canceled).toBeUndefined();
  });

  it('renders a canceled-only user with the canceled trip in the hero slot, muted', async () => {
    vi.mocked(getTripsWithVersions).mockResolvedValue([
      bundle(2, 'canceled', 'Only Canceled Trip'),
    ]);

    render(<MyPageUpcomingTravels />);

    // Not the empty state -- the canceled trip occupies the hero slot.
    const titles = await screen.findAllByText('Only Canceled Trip');
    expect(titles.length).toBeGreaterThan(0);
    expect(screen.queryByText(en['my_page.no_upcoming_trips'])).toBeNull();
    expect(screen.getByText('Canceled')).toBeTruthy();
    // The hero card container is muted.
    expect(titles[0].closest('a')?.querySelector('.opacity-70.grayscale')).toBeTruthy();
  });
});
