import { useState } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CityAutocomplete from '@/components/CityAutocomplete';
import { apiClient } from '@/lib/api-client';
import type { CitySuggestion, CityWithLocation } from '@/types/location';

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    getCitySuggestions: vi.fn(),
    resolveCity: vi.fn(),
    getCityById: vi.fn(),
  },
}));

const parisGoogle: CitySuggestion = {
  place_id: 'ChIJ-paris',
  city_id: null,
  primary_text: 'Paris',
  secondary_text: 'Île-de-France, France',
};
const parisTexas: CitySuggestion = {
  place_id: 'ChIJ-paris-tx',
  city_id: null,
  primary_text: 'Paris',
  secondary_text: 'Texas, USA',
};
const seoulDb: CitySuggestion = {
  place_id: null,
  city_id: 7,
  primary_text: 'Seoul',
  secondary_text: 'Seoul, South Korea',
};

const resolvedParis: CityWithLocation = {
  id: 42,
  status: true,
  name: { en: 'Paris', kr: '파리' },
  region_id: 3,
  slug: 'paris',
  link_services: false,
  schema_version: 1,
  region_name: 'Île-de-France',
  country_name: 'France',
  country_iso_code: 'FR',
};

function Harness({ onChange }: { onChange: (id: number | undefined) => void }) {
  const [cityId, setCityId] = useState<number | undefined>(undefined);
  return (
    <CityAutocomplete
      value={cityId}
      onChange={(id) => {
        setCityId(id);
        onChange(id);
      }}
    />
  );
}

let uuidSeq = 0;

beforeEach(() => {
  uuidSeq = 0;
  vi.spyOn(crypto, 'randomUUID').mockImplementation(
    () =>
      `00000000-0000-4000-8000-00000000000${++uuidSeq}` as `${string}-${string}-${string}-${string}-${string}`,
  );
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

function typeInto(value: string) {
  fireEvent.change(screen.getByPlaceholderText('Search city...'), { target: { value } });
}

describe('CityAutocomplete (Google Places suggestions, SMA-644)', () => {
  it('renders suggestions with their muted secondary text so same-name cities differ', async () => {
    vi.mocked(apiClient.getCitySuggestions).mockResolvedValue({
      source: 'google',
      suggestions: [parisGoogle, parisTexas],
    });
    render(<Harness onChange={vi.fn()} />);

    typeInto('Par');

    expect(await screen.findByText('Île-de-France, France')).toBeTruthy();
    expect(screen.getByText('Texas, USA')).toBeTruthy();
    expect(screen.getAllByText('Paris')).toHaveLength(2);
    expect(apiClient.getCitySuggestions).toHaveBeenCalledWith(
      'Par',
      '00000000-0000-4000-8000-000000000001',
      'en',
    );
  });

  it('does not search below 2 characters', async () => {
    render(<Harness onChange={vi.fn()} />);
    typeInto('P');
    await new Promise((r) => setTimeout(r, 400));
    expect(apiClient.getCitySuggestions).not.toHaveBeenCalled();
  });

  it('uses city_id directly (DB fallback) without calling resolve', async () => {
    vi.mocked(apiClient.getCitySuggestions).mockResolvedValue({
      source: 'db',
      suggestions: [seoulDb],
    });
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    typeInto('Seo');
    fireEvent.mouseDown(await screen.findByText('Seoul'));

    expect(onChange).toHaveBeenCalledWith(7);
    expect(apiClient.resolveCity).not.toHaveBeenCalled();
    expect(apiClient.getCityById).not.toHaveBeenCalled();
    expect((screen.getByPlaceholderText('Search city...') as HTMLInputElement).value).toBe('Seoul');
  });

  it('resolves a place_id with the same session token as the suggestions and emits the city id', async () => {
    vi.mocked(apiClient.getCitySuggestions).mockResolvedValue({
      source: 'google',
      suggestions: [parisGoogle],
    });
    vi.mocked(apiClient.resolveCity).mockResolvedValue(resolvedParis);
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    typeInto('Pa');
    typeInto('Par');
    await screen.findByText('Île-de-France, France');
    fireEvent.mouseDown(screen.getByText('Paris'));

    await waitFor(() => expect(onChange).toHaveBeenCalledWith(42));
    const token = '00000000-0000-4000-8000-000000000001';
    expect(apiClient.getCitySuggestions).toHaveBeenLastCalledWith('Par', token, 'en');
    expect(apiClient.resolveCity).toHaveBeenCalledWith('ChIJ-paris', token, 'en');
    expect((screen.getByPlaceholderText('Search city...') as HTMLInputElement).value).toBe('Paris');
  });

  it('starts a new session token after a pick', async () => {
    vi.mocked(apiClient.getCitySuggestions).mockResolvedValue({
      source: 'google',
      suggestions: [parisGoogle],
    });
    vi.mocked(apiClient.resolveCity).mockResolvedValue(resolvedParis);
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    typeInto('Par');
    fireEvent.mouseDown(await screen.findByText('Paris'));
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(42));

    typeInto('Lon');
    await waitFor(() =>
      expect(apiClient.getCitySuggestions).toHaveBeenLastCalledWith(
        'Lon',
        '00000000-0000-4000-8000-000000000002',
        'en',
      ),
    );
    // Typing after a pick clears the selection again.
    expect(onChange).toHaveBeenLastCalledWith(undefined);
  });

  it('shows the resolving state, then an error that keeps the dropdown usable', async () => {
    vi.mocked(apiClient.getCitySuggestions).mockResolvedValue({
      source: 'google',
      suggestions: [parisGoogle],
    });
    let rejectResolve: (e: Error) => void = () => {};
    vi.mocked(apiClient.resolveCity).mockImplementationOnce(
      () =>
        new Promise<CityWithLocation>((_, reject) => {
          rejectResolve = reject;
        }),
    );
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    typeInto('Par');
    fireEvent.mouseDown(await screen.findByText('Paris'));

    expect(await screen.findByText('Loading city details…')).toBeTruthy();
    await act(async () => rejectResolve(new Error('Places down')));

    expect(await screen.findByText("Couldn't save the city. Please try again.")).toBeTruthy();
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText('Paris')).toBeTruthy();

    // Retry from the still-open dropdown succeeds.
    vi.mocked(apiClient.resolveCity).mockResolvedValueOnce(resolvedParis);
    fireEvent.mouseDown(screen.getByText('Paris'));
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(42));
  });
});
