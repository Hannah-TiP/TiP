import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SearchBar from '@/components/SearchBar';
import { apiClient } from '@/lib/api-client';
import en from '@/translations/en.json';
import type { DestinationSuggestion } from '@/types/destination';

/**
 * SMA-768 regression: the mobile planner overlay must actually APPLY picks.
 *
 * Unlike SearchBar.test.tsx (which stubs every dropdown), this suite renders
 * the REAL dropdown components so their document-level `mousedown`
 * outside-click listeners are live, and drives them with the browser's tap
 * sequence (mousedown → mouseup → click). The original bug only appears under
 * both conditions: the desktop bar's CSS-hidden twin of the open picker closed
 * it on `mousedown`, before the overlay picker's `click` could land.
 */

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    lang: 'en' as const,
    setLang: vi.fn(),
    t: (key: string) => (en as Record<string, string>)[key] ?? key,
  }),
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    searchDestinations: vi.fn(),
  },
}));

const paris: DestinationSuggestion = {
  id: 7,
  type: 'city',
  name: { en: 'Paris', kr: '파리' },
  slug: 'paris',
  region_name: { en: 'Ile-de-France', kr: '일드프랑스' },
  country_name: { en: 'France', kr: '프랑스' },
};

const assignMock = vi.fn();

beforeEach(() => {
  // Fake only Date so the calendar opens on a known month; real timers keep
  // the destination search debounce working.
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 5, 1));
  vi.mocked(apiClient.searchDestinations).mockResolvedValue([paris]);
  vi.stubGlobal('location', { ...window.location, assign: assignMock });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

/** The pointer sequence a real tap/click dispatches. */
function tap(el: Element) {
  fireEvent.mouseDown(el);
  fireEvent.mouseUp(el);
  fireEvent.click(el);
}

function openOverlay() {
  render(<SearchBar />);
  tap(screen.getByTestId('searchbar-mobile-cta'));
  return screen.getByTestId('searchbar-overlay');
}

function openField(overlay: HTMLElement, label: string) {
  tap(within(overlay).getByText(label, { exact: true }));
}

describe('SearchBar mobile overlay — real pickers (SMA-768)', () => {
  it('mounts exactly one instance of the open picker (no hidden desktop twin)', async () => {
    const overlay = openOverlay();
    openField(overlay, 'Destination');

    await within(overlay).findByText('Paris');
    expect(screen.getAllByPlaceholderText('Search destinations...')).toHaveLength(1);
  });

  it('applies a destination tapped in the overlay', async () => {
    const overlay = openOverlay();
    openField(overlay, 'Destination');

    tap(await within(overlay).findByText('Paris'));

    expect(screen.queryByPlaceholderText('Search destinations...')).toBeNull();
    expect(within(overlay).getByText('Paris')).toBeTruthy();
    expect(within(overlay).queryByText('Where to?')).toBeNull();
  });

  it('applies a check-in / check-out range tapped in the overlay', () => {
    const overlay = openOverlay();
    openField(overlay, 'Check-in');

    // The picker shows June + July 2026; the first "10"/"15" are June's.
    tap(within(overlay).getAllByRole('button', { name: '10' })[0]);
    tap(within(overlay).getAllByRole('button', { name: '15' })[0]);
    tap(within(overlay).getByText('Done'));

    expect(within(overlay).getByText('2026-06-10')).toBeTruthy();
    expect(within(overlay).getByText('2026-06-15')).toBeTruthy();
  });

  it('applies guests, trip type and travel style tapped in the overlay', () => {
    const overlay = openOverlay();

    openField(overlay, 'Guests');
    tap(within(overlay).getAllByRole('button', { name: '+' })[0]);
    expect(within(overlay).getByText('3 Guests')).toBeTruthy();

    openField(overlay, 'Trip Type');
    tap(within(overlay).getByText('Business'));
    expect(within(overlay).getByText('Business')).toBeTruthy();
    expect(within(overlay).queryByText('Bleisure')).toBeNull();

    openField(overlay, 'Travel Style');
    tap(within(overlay).getByText('Romantic Escape'));
    expect(within(overlay).getByText('Romantic Escape')).toBeTruthy();
    expect(within(overlay).queryByText('Any Style')).toBeNull();
  });

  it('carries overlay picks into the /concierge prefill URL', async () => {
    const overlay = openOverlay();

    openField(overlay, 'Destination');
    tap(await within(overlay).findByText('Paris'));

    openField(overlay, 'Check-in');
    tap(within(overlay).getAllByRole('button', { name: '10' })[0]);
    tap(within(overlay).getAllByRole('button', { name: '15' })[0]);
    tap(within(overlay).getByText('Done'));

    tap(within(overlay).getByRole('button', { name: /plan my trip/i }));

    expect(assignMock).toHaveBeenCalledTimes(1);
    const params = new URLSearchParams(assignMock.mock.calls[0][0].split('?')[1] ?? '');
    expect(params.get('cityId')).toBe('7');
    expect(params.get('city')).toBe('Paris');
    expect(params.get('checkIn')).toBe('2026-06-10');
    expect(params.get('checkOut')).toBe('2026-06-15');
  });

  it('still applies picks from the desktop bar when the overlay is closed', async () => {
    render(<SearchBar />);
    // Desktop bar is the first match (the overlay is not mounted).
    tap(screen.getAllByText('Destination', { exact: true })[0]);
    tap(await screen.findByText('Paris'));

    expect(screen.queryByPlaceholderText('Search destinations...')).toBeNull();
    expect(screen.getByText('Paris')).toBeTruthy();
  });
});
