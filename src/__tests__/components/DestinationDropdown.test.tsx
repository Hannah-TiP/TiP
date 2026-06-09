import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DestinationDropdown from '@/components/DestinationDropdown';
import { apiClient } from '@/lib/api-client';
import type { DestinationSuggestion } from '@/types/destination';

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    searchDestinations: vi.fn(),
  },
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const paris: DestinationSuggestion = {
  id: 1,
  type: 'city',
  name: { en: 'Paris', kr: '파리' },
  slug: 'paris',
  region_name: { en: 'Ile-de-France', kr: '일드프랑스' },
  country_name: { en: 'France', kr: '프랑스' },
};

const france: DestinationSuggestion = {
  id: 2,
  type: 'country',
  name: { en: 'France', kr: '프랑스' },
  iso_code: 'FR',
};

describe('DestinationDropdown', () => {
  it('searches via the shared searchDestinations endpoint (not getCities)', async () => {
    vi.mocked(apiClient.searchDestinations).mockResolvedValue([paris]);

    render(<DestinationDropdown value="" onChange={vi.fn()} onClose={vi.fn()} />);

    const input = await screen.findByPlaceholderText('Search destinations...');
    fireEvent.change(input, { target: { value: 'Paris' } });

    await waitFor(() => {
      expect(apiClient.searchDestinations).toHaveBeenCalledWith(
        'Paris',
        expect.objectContaining({ language: 'en', limit: 10 }),
      );
    });
    expect(await screen.findByText('Paris')).toBeTruthy();
  });

  it('renders the typed 3-level suggestions including non-city types', async () => {
    vi.mocked(apiClient.searchDestinations).mockResolvedValue([france, paris]);

    render(<DestinationDropdown value="" onChange={vi.fn()} onClose={vi.fn()} />);

    fireEvent.change(await screen.findByPlaceholderText('Search destinations...'), {
      target: { value: 'France' },
    });

    // Both a country and a city result render with their type chips.
    expect(await screen.findByText('Country')).toBeTruthy();
    expect(await screen.findByText('City')).toBeTruthy();
    // City shows its country/region subtitle.
    expect(screen.getByText('France · Ile-de-France')).toBeTruthy();
  });

  it('passes the selected destination id and name to onChange', async () => {
    vi.mocked(apiClient.searchDestinations).mockResolvedValue([paris]);
    const onChange = vi.fn();

    render(<DestinationDropdown value="" onChange={onChange} onClose={vi.fn()} />);

    fireEvent.click(await screen.findByText('Paris'));

    expect(onChange).toHaveBeenCalledWith({ id: 1, name: 'Paris' });
  });

  it('shows the popular bookable set on the initial empty state', async () => {
    vi.mocked(apiClient.searchDestinations).mockResolvedValue([paris]);

    render(<DestinationDropdown value="" onChange={vi.fn()} onClose={vi.fn()} />);

    // With a blank query the hook fetches the top bookable destinations.
    await waitFor(() => {
      expect(apiClient.searchDestinations).toHaveBeenCalledWith(
        '',
        expect.objectContaining({ language: 'en' }),
      );
    });
    expect(await screen.findByText('Popular destinations')).toBeTruthy();
  });
});
