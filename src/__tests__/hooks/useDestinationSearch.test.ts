import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDestinationSearch } from '@/hooks/useDestinationSearch';
import { apiClient } from '@/lib/api-client';
import type { DestinationSuggestion } from '@/types/destination';

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    searchDestinations: vi.fn(),
  },
}));

afterEach(() => {
  vi.clearAllMocks();
});

const paris: DestinationSuggestion = {
  id: 1,
  type: 'city',
  name: { en: 'Paris', kr: '파리' },
};

describe('useDestinationSearch', () => {
  it('fetches the popular set with a blank query (initial state)', async () => {
    vi.mocked(apiClient.searchDestinations).mockResolvedValue([paris]);

    const { result } = renderHook(() => useDestinationSearch('', { language: 'en' }));

    await waitFor(() => {
      expect(result.current.suggestions).toEqual([paris]);
    });
    expect(result.current.isPopular).toBe(true);
    expect(apiClient.searchDestinations).toHaveBeenCalledWith(
      '',
      expect.objectContaining({ language: 'en' }),
    );
  });

  it('forwards the query and language to the shared search', async () => {
    vi.mocked(apiClient.searchDestinations).mockResolvedValue([paris]);

    const { result } = renderHook(() => useDestinationSearch('파리', { language: 'kr', limit: 5 }));

    await waitFor(() => {
      expect(apiClient.searchDestinations).toHaveBeenCalledWith('파리', {
        language: 'kr',
        limit: 5,
      });
    });
    expect(result.current.isPopular).toBe(false);
  });

  it('does not call the API and clears results when disabled', async () => {
    const { result } = renderHook(() =>
      useDestinationSearch('Paris', { language: 'en', disabled: true }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.suggestions).toEqual([]);
    expect(apiClient.searchDestinations).not.toHaveBeenCalled();
  });

  it('falls back to an empty list when the search fails', async () => {
    vi.mocked(apiClient.searchDestinations).mockRejectedValue(new Error('boom'));
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useDestinationSearch('Paris', { language: 'en' }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.suggestions).toEqual([]);
    errSpy.mockRestore();
  });
});
