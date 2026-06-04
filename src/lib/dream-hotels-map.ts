import type { DestinationSuggestion } from '@/types/destination';

/**
 * Whether the dream-hotels map should render.
 *
 * The map is only shown once the user has expressed a "where do I want to go"
 * signal — either a non-empty hotel-name search OR a selected destination
 * (country / region / city). Star-rating alone is intentionally excluded.
 */
export function shouldShowDreamHotelsMap(
  search: string,
  destination: DestinationSuggestion | null,
): boolean {
  return search.trim().length > 0 || destination !== null;
}
