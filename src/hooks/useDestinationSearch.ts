'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { useDebounce } from '@/hooks/useDebounce';
import type { DestinationSuggestion } from '@/types/destination';

interface UseDestinationSearchOptions {
  /** When true, the hook short-circuits and clears suggestions (e.g. a result is
   *  already selected). */
  disabled?: boolean;
  /** Result language — forwarded to the backend so KR names come back in KR. */
  language: 'en' | 'kr';
  /** Max results. */
  limit?: number;
}

interface UseDestinationSearchResult {
  suggestions: DestinationSuggestion[];
  isLoading: boolean;
  /** True while the input is blank — the suggestions are the "popular" set. */
  isPopular: boolean;
}

/**
 * Shared destination typeahead for the home hero and Dream Hotels.
 *
 * Both surfaces hit the SAME backend search (`apiClient.searchDestinations`),
 * which returns only bookable destinations (≥1 published hotel) ranked by match
 * quality. A blank query returns the top bookable destinations (initial state),
 * so both surfaces show a sensible list before the user types.
 */
export function useDestinationSearch(
  query: string,
  { disabled = false, language, limit = 10 }: UseDestinationSearchOptions,
): UseDestinationSearchResult {
  const debouncedQuery = useDebounce(query, 300);
  const trimmed = debouncedQuery.trim();
  const [suggestions, setSuggestions] = useState<DestinationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (disabled) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    async function fetchSuggestions() {
      setIsLoading(true);
      try {
        // A blank query returns the top bookable destinations (initial state).
        const results = await apiClient.searchDestinations(trimmed, {
          limit,
          language,
        });
        if (!cancelled) {
          setSuggestions(results);
        }
      } catch (error) {
        console.error('Failed to search destinations:', error);
        if (!cancelled) {
          setSuggestions([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchSuggestions();
    return () => {
      cancelled = true;
    };
  }, [trimmed, disabled, language, limit]);

  return { suggestions, isLoading, isPopular: trimmed.length === 0 };
}
