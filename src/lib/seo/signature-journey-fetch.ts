import { cache } from 'react';
import type { Lang } from '@/contexts/LanguageContext';
import type { SignatureJourney } from '@/types/signatureJourney';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

/**
 * Server-side fetch of a published signature journey by slug, wrapped in React
 * `cache()` so `generateMetadata` and the JSON-LD server component share a
 * SINGLE backend request per render (no double fetch).
 *
 * Hits the backend directly (not the /api proxy — that is browser-only) with
 * the `lang` header the by-slug endpoint expects (`en` / `kr`, NOT a BCP-47
 * tag). Returns `null` on any failure (404, network, malformed body) so callers
 * degrade gracefully — a missing/failed journey must never 500 the page.
 */
export const getSignatureJourneyBySlugServer = cache(
  async (slug: string, lang: Lang): Promise<SignatureJourney | null> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v2/signature-journeys/by-slug/${encodeURIComponent(slug)}`,
        {
          headers: {
            'Content-Type': 'application/json',
            lang,
          },
        },
      );

      if (!response.ok) {
        return null;
      }

      const body = (await response.json()) as { data?: SignatureJourney };
      return body.data ?? null;
    } catch {
      return null;
    }
  },
);
