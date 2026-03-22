import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DestinationDropdown from '@/components/DestinationDropdown';
import { apiClient } from '@/lib/api-client';

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    getCities: vi.fn(),
  },
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('DestinationDropdown', () => {
  it('renders localized city names from MultiLanguageString values', async () => {
    vi.mocked(apiClient.getCities).mockResolvedValue([
      {
        id: 1,
        region_id: 10,
        slug: 'seoul',
        status: true,
        name: { en: 'Seoul', kr: '서울' },
        link_services: true,
        schema_version: 1,
      },
    ]);

    render(<DestinationDropdown value="" onChange={vi.fn()} onClose={vi.fn()} />);

    expect(await screen.findByText('Seoul')).toBeTruthy();
  });

  it('returns the localized text when a city is selected', async () => {
    vi.mocked(apiClient.getCities).mockResolvedValue([
      {
        id: 1,
        region_id: 10,
        slug: 'seoul',
        status: true,
        name: { en: 'Seoul', kr: '서울' },
        link_services: true,
        schema_version: 1,
      },
    ]);
    const onChange = vi.fn();

    render(<DestinationDropdown value="" onChange={onChange} onClose={vi.fn()} />);

    fireEvent.click(await screen.findByText('Seoul'));

    expect(onChange).toHaveBeenCalledWith({ id: 1, name: 'Seoul' });
  });

  it('filters destinations using the localized text value', async () => {
    vi.mocked(apiClient.getCities).mockResolvedValue([
      {
        id: 1,
        region_id: 10,
        slug: 'seoul',
        status: true,
        name: { en: 'Seoul', kr: '서울' },
        link_services: true,
        schema_version: 1,
      },
      {
        id: 2,
        region_id: 11,
        slug: 'tokyo',
        status: true,
        name: { en: 'Tokyo', kr: '도쿄' },
        link_services: true,
        schema_version: 1,
      },
    ]);

    render(<DestinationDropdown value="" onChange={vi.fn()} onClose={vi.fn()} />);

    const input = await screen.findByPlaceholderText('Search destinations...');
    fireEvent.change(input, { target: { value: 'seo' } });

    await waitFor(() => {
      expect(screen.getByText('Seoul')).toBeTruthy();
      expect(screen.queryByText('Tokyo')).toBeNull();
    });
  });
});
