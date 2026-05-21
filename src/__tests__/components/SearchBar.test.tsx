import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SearchBar from '@/components/SearchBar';

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

function clickFieldByText(text: string) {
  const field = screen.getByText(text);
  fireEvent.click(field);
}

describe('SearchBar.handleSearch', () => {
  it('routes to /concierge with prefill=1 and all picked field values encoded in the URL', () => {
    render(<SearchBar />);

    // Open + pick each dropdown.
    clickFieldByText('DESTINATION');
    fireEvent.click(screen.getByText('Pick Paris'));

    clickFieldByText('CHECK-IN');
    fireEvent.click(screen.getByText('Pick dates'));

    clickFieldByText('GUESTS');
    fireEvent.click(screen.getByText('Pick guests'));

    clickFieldByText('TRIP TYPE');
    fireEvent.click(screen.getByText('Pick business'));

    clickFieldByText('TRAVEL STYLE');
    fireEvent.click(screen.getByText('Pick style'));

    fireEvent.click(screen.getByRole('button', { name: /plan my trip/i }));

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
    render(<SearchBar />);

    // Submit immediately without picking any field. Defaults are
    // tripType=Leisure, adults=2, children=0 (per the SearchBar state).
    fireEvent.click(screen.getByRole('button', { name: /plan my trip/i }));

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
    render(<SearchBar />);

    clickFieldByText('DESTINATION');
    fireEvent.click(screen.getByText('Pick Paris'));

    fireEvent.click(screen.getByRole('button', { name: /plan my trip/i }));

    const navigatedUrl: string = assignMock.mock.calls[0][0];
    const params = new URLSearchParams(navigatedUrl.split('?')[1] ?? '');
    expect(params.has('checkIn')).toBe(false);
    expect(params.has('checkOut')).toBe(false);
  });
});
