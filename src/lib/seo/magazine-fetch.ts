import { cache } from 'react';
import type { Lang } from '@/contexts/LanguageContext';
import type { MagazineArticleDetail, MagazineArticleType } from '@/types/magazine';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

/**
 * Server-side fetch of a published magazine article's full `seo_render` payload.
 *
 * Wrapped in React `cache()` so `generateMetadata` and the page component share
 * ONE backend request per render. Returns `null` on a 404 / non-published
 * article / any failure — both callers (metadata + JSON-LD/page) handle `null`
 * gracefully (no 500; the page maps it to `notFound()`).
 *
 * `lang` is mapped to the backend `Language` header so the response collapses
 * MultiLanguageStrings to the requested locale (matching every other server
 * fetch). The backend expects the SINGULAR type enum — callers MUST map the
 * plural URL segment before calling this.
 */
export const getMagazineArticleServer = cache(
  async (
    typeEnum: MagazineArticleType,
    slug: string,
    lang: Lang,
  ): Promise<MagazineArticleDetail | null> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v2/magazine/articles/${typeEnum}/${encodeURIComponent(slug)}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Language: lang,
          },
        },
      );

      if (!response.ok) return null;

      const payload = (await response.json()) as { data?: MagazineArticleDetail };
      return payload.data ?? null;
    } catch (error) {
      console.error('Magazine article server fetch failed:', error);
      return null;
    }
  },
);
