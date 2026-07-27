import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import TripDetailPanel from '@/components/ai-chat/TripDetailPanel';
import { JOURNEY_STEP_ORDER } from '@/lib/trip-display';
import type { TripWithVersion } from '@/lib/trip-utils';
import type { TripDay, TripStatus } from '@/types/trip';
import enTranslations from '@/translations/en.json';

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => (enTranslations as Record<string, string>)[key] ?? key,
    lang: 'en',
    setLang: () => {},
  }),
}));

afterEach(() => {
  cleanup();
});

function makeTripWithVersion(plan: TripDay[], status: TripStatus = 'draft'): TripWithVersion {
  return {
    trip: {
      id: 1,
      user_id: 1,
      status,
      current_trip_version_id: 1,
      schema_version: 1,
    },
    currentVersion: {
      id: 1,
      trip_id: 1,
      version_number: 1,
      title: 'Paris Trip',
      summary: 'Leisure',
      start_date: '2026-06-01',
      end_date: '2026-06-03',
      adults: 2,
      kids: 0,
      plan,
      schema_version: 1,
    },
    activeQuote: null,
  };
}

describe('TripDetailPanel — detailed itinerary view', () => {
  it('renders the summary row with the trip summary (not the title) plus dates/travelers', () => {
    render(<TripDetailPanel tripDetail={makeTripWithVersion([])} />);

    const summaryRow = screen.getByTestId('trip-row-summary');
    expect(summaryRow.textContent).toContain('Summary');
    expect(summaryRow.textContent).toContain('Leisure');
    // The title must NOT leak into the summary slot.
    expect(summaryRow.textContent).not.toContain('Paris Trip');
    // The removed Purpose row must not produce a duplicate summary line.
    expect(screen.queryByTestId('trip-row-purpose')).toBeNull();
    expect(screen.getByTestId('trip-row-dates')).toBeDefined();
    expect(screen.getByTestId('trip-row-travelers').textContent).toContain('2');
  });

  it('renders a muted placeholder (not the title, not New Trip) when the summary is empty', () => {
    const tripDetail = makeTripWithVersion([]);
    tripDetail.currentVersion!.summary = '';
    render(<TripDetailPanel tripDetail={tripDetail} />);

    const summaryRow = screen.getByTestId('trip-row-summary');
    expect(summaryRow.textContent).toContain('No summary yet');
    expect(summaryRow.textContent).not.toContain('Paris Trip');
    expect(summaryRow.textContent).not.toContain('New Trip');
  });

  it('does NOT render the Travel Plans section when the plan is empty', () => {
    render(<TripDetailPanel tripDetail={makeTripWithVersion([])} />);

    // Other rows still present, but no Travel Plans header
    expect(screen.getByTestId('trip-row-summary')).toBeDefined();
    expect(screen.queryByText('Travel Plans')).toBeNull();
    expect(screen.queryByTestId('trip-day-0')).toBeNull();
  });

  it('renders day with detailed items including type badge, title, location, time, and description', () => {
    const tripDetail = makeTripWithVersion([
      {
        date: '2026-06-01',
        title: 'Arrival Day',
        items: [
          {
            item_type: 'hotel',
            title: 'Ritz Paris',
            location: '15 Place Vendôme',
            start_at: '2026-06-01T15:00:00',
            end_at: null,
            description: 'Check in to the iconic hotel.',
          },
          {
            item_type: 'restaurant',
            title: 'Le Jules Verne',
            location: 'Eiffel Tower',
            start_at: '2026-06-01T19:30:00',
            end_at: '2026-06-01T22:00:00',
            description: null,
          },
        ],
      },
    ]);
    render(<TripDetailPanel tripDetail={tripDetail} />);

    // Day container exists with title shown
    const day = screen.getByTestId('trip-day-0');
    expect(day).toBeDefined();
    expect(day.textContent).toContain('Arrival Day');
    expect(day.textContent).toContain('Day 1');

    // Hotel item — badge label, title, location, description
    const hotelItem = screen.getByTestId('trip-plan-item-hotel-0');
    expect(hotelItem).toBeDefined();
    expect(hotelItem.textContent).toContain('Hotel');
    expect(hotelItem.textContent).toContain('Ritz Paris');
    expect(hotelItem.textContent).toContain('15 Place Vendôme');
    expect(hotelItem.textContent).toContain('Check in to the iconic hotel.');

    // Restaurant item with time range — should include the en-dash separator
    const restaurantItem = screen.getByTestId('trip-plan-item-restaurant-1');
    expect(restaurantItem).toBeDefined();
    expect(restaurantItem.textContent).toContain('Restaurant');
    expect(restaurantItem.textContent).toContain('Le Jules Verne');
    expect(restaurantItem.textContent).toMatch(/–/);
  });

  it('shows a "no items for this day" note for an empty day but still renders the day header', () => {
    const tripDetail = makeTripWithVersion([
      {
        date: '2026-06-01',
        title: null,
        items: [],
      },
    ]);
    render(<TripDetailPanel tripDetail={tripDetail} />);

    const day = screen.getByTestId('trip-day-0');
    expect(day).toBeDefined();
    expect(day.textContent).toContain('Day 1');
    expect(day.textContent).toContain('No items for this day');
    expect(screen.queryByTestId('trip-plan-item-hotel-0')).toBeNull();
  });

  it('renders multiple days with the correct day index in test ids', () => {
    const tripDetail = makeTripWithVersion([
      { date: '2026-06-01', items: [{ item_type: 'note', title: 'Welcome' }] },
      { date: '2026-06-02', items: [{ item_type: 'activity', title: 'Louvre Tour' }] },
    ]);
    render(<TripDetailPanel tripDetail={tripDetail} />);

    expect(screen.getByTestId('trip-day-0')).toBeDefined();
    expect(screen.getByTestId('trip-day-1')).toBeDefined();
    expect(screen.getByTestId('trip-plan-item-note-0').textContent).toContain('Welcome');
    expect(screen.getByTestId('trip-plan-item-activity-0').textContent).toContain('Louvre Tour');
  });

  it('preserves the Submit Trip button for draft trips when onSubmitTrip is provided', () => {
    render(<TripDetailPanel tripDetail={makeTripWithVersion([])} onSubmitTrip={() => {}} />);

    const submitBtn = screen.getByText('Submit Trip');
    expect(submitBtn).toBeDefined();
  });

  it('shows the empty state when there is no trip detail at all', () => {
    render(<TripDetailPanel tripDetail={null} />);

    expect(screen.queryByTestId('trip-row-summary')).toBeNull();
    expect(screen.queryByText('Travel Plans')).toBeNull();
  });

  it('renders a "View trip details" link pointing to /my-page/trip/<id>', () => {
    render(<TripDetailPanel tripDetail={makeTripWithVersion([])} />);

    const link = screen.getByTestId('trip-detail-panel-view-trip-link');
    expect(link).toBeDefined();
    expect(link.getAttribute('href')).toBe('/my-page/trip/1');
  });

  it('does NOT render the "View trip details" link when there is no trip', () => {
    render(<TripDetailPanel tripDetail={null} />);

    expect(screen.queryByTestId('trip-detail-panel-view-trip-link')).toBeNull();
  });
});

describe('TripDetailPanel — journey stepper', () => {
  function stepStates(): Record<string, string> {
    const states: Record<string, string> = {};
    for (const step of JOURNEY_STEP_ORDER) {
      states[step.key] = screen.getByTestId(`journey-step-${step.key}`).getAttribute('data-state')!;
    }
    return states;
  }

  it('renders all 8 steps including the dedicated Paid step', () => {
    render(<TripDetailPanel tripDetail={makeTripWithVersion([], 'paid')} />);

    expect(JOURNEY_STEP_ORDER).toHaveLength(8);
    for (const step of JOURNEY_STEP_ORDER) {
      expect(screen.getByTestId(`journey-step-${step.key}`)).toBeDefined();
    }
    expect(screen.getByTestId('journey-step-paid').textContent).toContain('Paid');
  });

  it('marks a paid trip as filled through Payment with Paid current', () => {
    render(<TripDetailPanel tripDetail={makeTripWithVersion([], 'paid')} />);

    expect(stepStates()).toEqual({
      draft: 'completed',
      'waiting-for-proposal': 'completed',
      'in-progress': 'completed',
      'waiting-for-payment': 'completed',
      paid: 'current',
      'ready-to-travel': 'upcoming',
      'traveling-now': 'upcoming',
      'travel-completed': 'upcoming',
    });
  });

  it('marks a ready-to-travel trip as filled through Paid with Ready current', () => {
    render(<TripDetailPanel tripDetail={makeTripWithVersion([], 'ready-to-travel')} />);

    const states = stepStates();
    expect(states.paid).toBe('completed');
    expect(states['ready-to-travel']).toBe('current');
    expect(states['traveling-now']).toBe('upcoming');
  });

  it('renders every non-canceled status with an active step (no blank track)', () => {
    const statuses: TripStatus[] = [
      'draft',
      'waiting-for-proposal',
      'in-progress',
      'waiting-for-payment',
      'paid',
      'ready-to-travel',
      'traveling-now',
      'travel-completed',
    ];
    for (const status of statuses) {
      render(<TripDetailPanel tripDetail={makeTripWithVersion([], status)} />);
      const states = stepStates();
      expect(Object.values(states).filter((s) => s === 'current')).toHaveLength(1);
      cleanup();
    }
  });

  it('renders a canceled trip with NO active or completed step (current behavior preserved)', () => {
    render(<TripDetailPanel tripDetail={makeTripWithVersion([], 'canceled')} />);

    const states = stepStates();
    expect(Object.values(states).every((s) => s === 'upcoming')).toBe(true);
  });

  it('falls back to the first step (with a console warning) for an unknown status', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <TripDetailPanel tripDetail={makeTripWithVersion([], 'mystery-status' as TripStatus)} />,
    );

    expect(stepStates().draft).toBe('current');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('mystery-status');
    warn.mockRestore();
  });
});
