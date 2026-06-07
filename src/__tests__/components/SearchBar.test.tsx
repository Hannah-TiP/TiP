import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SearchBar from '@/components/SearchBar';
import en from '@/translations/en.json';

// SearchBar reads its copy from the i18n catalog via useLanguage(). Mock the
// context (the real provider touches localStorage) so t() resolves against the
// real EN catalog — that keeps the field-label assertions honest.
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    lang: 'en' as const,
    setLang: vi.fn(),
    t: (key: string) => (en as Record<string, string>)[key] ?? key,
  }),
}));

function renderSearchBar() {
  return render(<SearchBar />);
}

// SearchBar performs a full navigation (window.location.assign), not
// router.push — see the comment in handleSearch — so capture assign() to
// assert the final URL.
const assignMock = vi.fn();

// The dropdowns are out of scope here — keep them tiny so the test can
// drive the underlying state via injected event handlers. Each replacement
// exposes a button that calls the onChange prop with a deterministic
// value, so the test can simulate the user picking each field without
// pulling DataPicker / API mocks into the surface.
vi.mock('@/components/DestinationDropdown', () => ({
  default: ({
    onChange,
    onClose,
  }: {
    onChange: (city: { id: number; name: string }) => void;
    onClose: () => void;
  }) => (
    <div data-testid="destination-dropdown">
      <button
        onClick={() => {
          onChange({ id: 7, name: 'Paris' });
          onClose();
        }}
      >
        Pick Paris
      </button>
    </div>
  ),
}));

vi.mock('@/components/DatePickerDropdown', () => ({
  default: ({
    onChange,
    onClose,
  }: {
    onChange: (checkIn: string, checkOut: string) => void;
    onClose: () => void;
  }) => (
    <div data-testid="date-dropdown">
      <button
        onClick={() => {
          onChange('2026-06-01', '2026-06-07');
          onClose();
        }}
      >
        Pick dates
      </button>
    </div>
  ),
}));

vi.mock('@/components/GuestsDropdown', () => ({
  default: ({
    onChange,
    onClose,
  }: {
    onChange: (adults: number, children: number) => void;
    onClose: () => void;
  }) => (
    <div data-testid="guests-dropdown">
      <button
        onClick={() => {
          onChange(3, 1);
          onClose();
        }}
      >
        Pick guests
      </button>
    </div>
  ),
}));

vi.mock('@/components/TripTypeDropdown', () => ({
  default: ({ onChange, onClose }: { onChange: (val: string) => void; onClose: () => void }) => (
    <div data-testid="trip-type-dropdown">
      <button
        onClick={() => {
          onChange('Business');
          onClose();
        }}
      >
        Pick business
      </button>
    </div>
  ),
}));

vi.mock('@/components/TravelStyleDropdown', () => ({
  default: ({ onChange, onClose }: { onChange: (val: string) => void; onClose: () => void }) => (
    <div data-testid="travel-style-dropdown">
      <button
        onClick={() => {
          onChange('Romantic Escape');
          onClose();
        }}
      >
        Pick style
      </button>
    </div>
  ),
}));

beforeEach(() => {
  assignMock.mockReset();
  // jsdom's window.location.assign is non-configurable, so stub the whole
  // location global with a spreadable copy plus our mock assign().
  vi.stubGlobal('location', { ...window.location, assign: assignMock });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

// The desktop inline bar and the mobile CTA both render a "Plan My Trip"
// label, so scope field/submit interactions to the always-mounted desktop
// bar (the first match) to keep these handleSearch tests deterministic.
function clickFieldByText(text: string) {
  // The desktop bar renders these labels first; getAllByText[0] is the
  // desktop cell (the overlay only mounts when opened).
  const field = screen.getAllByText(text)[0];
  fireEvent.click(field);
}

function submitDesktop() {
  // First "Plan My Trip" button in DOM order is the desktop bar's submit.
  fireEvent.click(screen.getAllByRole('button', { name: /plan my trip/i })[0]);
}

describe('SearchBar.handleSearch', () => {
  it('routes to /concierge with prefill=1 and all picked field values encoded in the URL', () => {
    renderSearchBar();

    // Open + pick each dropdown.
    clickFieldByText('Destination');
    fireEvent.click(screen.getByText('Pick Paris'));

    clickFieldByText('Check-in');
    fireEvent.click(screen.getByText('Pick dates'));

    clickFieldByText('Guests');
    fireEvent.click(screen.getByText('Pick guests'));

    clickFieldByText('Trip Type');
    fireEvent.click(screen.getByText('Pick business'));

    clickFieldByText('Travel Style');
    fireEvent.click(screen.getByText('Pick style'));

    submitDesktop();

    expect(assignMock).toHaveBeenCalledTimes(1);
    const navigatedUrl: string = assignMock.mock.calls[0][0];
    expect(navigatedUrl.startsWith('/concierge?')).toBe(true);

    const params = new URLSearchParams(navigatedUrl.split('?')[1] ?? '');
    expect(params.get('prefill')).toBe('1');
    expect(params.get('cityId')).toBe('7');
    expect(params.get('city')).toBe('Paris');
    expect(params.get('checkIn')).toBe('2026-06-01');
    expect(params.get('checkOut')).toBe('2026-06-07');
    expect(params.get('adults')).toBe('3');
    expect(params.get('children')).toBe('1');
    expect(params.get('tripType')).toBe('Business');
    expect(params.get('travelStyle')).toBe('Romantic Escape');
  });

  it('allows Search with NO destination — destination is no longer required', () => {
    renderSearchBar();

    // Submit immediately without picking any field. Defaults are
    // tripType=Leisure, adults=2, children=0 (per the SearchBar state).
    submitDesktop();

    expect(assignMock).toHaveBeenCalledTimes(1);
    const navigatedUrl: string = assignMock.mock.calls[0][0];
    expect(navigatedUrl.startsWith('/concierge?')).toBe(true);

    const params = new URLSearchParams(navigatedUrl.split('?')[1] ?? '');
    expect(params.get('prefill')).toBe('1');
    expect(params.get('cityId')).toBeNull();
    expect(params.get('city')).toBeNull();
    expect(params.get('adults')).toBe('2');
    expect(params.get('children')).toBe('0');
    expect(params.get('tripType')).toBe('Leisure');
    // travelStyle defaults to empty — should be absent.
    expect(params.get('travelStyle')).toBeNull();
  });

  it('omits the dates params entirely when the user did not pick dates', () => {
    renderSearchBar();

    clickFieldByText('Destination');
    fireEvent.click(screen.getByText('Pick Paris'));

    submitDesktop();

    const navigatedUrl: string = assignMock.mock.calls[0][0];
    const params = new URLSearchParams(navigatedUrl.split('?')[1] ?? '');
    expect(params.has('checkIn')).toBe(false);
    expect(params.has('checkOut')).toBe(false);
  });
});

describe('SearchBar mobile overlay', () => {
  it('does not render the overlay until the mobile CTA is tapped', () => {
    renderSearchBar();

    // CTA is always mounted (CSS-hidden on desktop); overlay is not.
    expect(screen.getByTestId('searchbar-mobile-cta')).toBeTruthy();
    expect(screen.queryByTestId('searchbar-overlay')).toBeNull();
  });

  it('opens the full-screen overlay with all 5 fields and closes via the X button', () => {
    renderSearchBar();

    fireEvent.click(screen.getByTestId('searchbar-mobile-cta'));

    const overlay = screen.getByTestId('searchbar-overlay');
    expect(overlay).toBeTruthy();

    // All 5 field labels are present inside the overlay.
    for (const label of ['Destination', 'Check-in', 'Check-out', 'Guests', 'Trip Type']) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }

    fireEvent.click(screen.getByTestId('searchbar-overlay-close'));
    expect(screen.queryByTestId('searchbar-overlay')).toBeNull();
  });

  it('submits the overlay selections and routes to /concierge with prefill', () => {
    renderSearchBar();

    fireEvent.click(screen.getByTestId('searchbar-mobile-cta'));

    // Pick a destination inside the overlay, then submit via the overlay's
    // own "Plan My Trip" button (the last one in DOM order). The desktop bar
    // and the overlay share activeDropdown state, so the mocked dropdown can
    // render in both — click the last "Pick Paris" (the overlay's).
    fireEvent.click(screen.getAllByText('Destination').slice(-1)[0]);
    const pickParis = screen.getAllByText('Pick Paris');
    fireEvent.click(pickParis[pickParis.length - 1]);

    const submitButtons = screen.getAllByRole('button', { name: /plan my trip/i });
    fireEvent.click(submitButtons[submitButtons.length - 1]);

    expect(assignMock).toHaveBeenCalledTimes(1);
    const navigatedUrl: string = assignMock.mock.calls[0][0];
    const params = new URLSearchParams(navigatedUrl.split('?')[1] ?? '');
    expect(params.get('prefill')).toBe('1');
    expect(params.get('cityId')).toBe('7');
    expect(params.get('city')).toBe('Paris');
  });
});
