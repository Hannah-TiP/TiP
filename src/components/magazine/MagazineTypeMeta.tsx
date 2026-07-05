'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { insiderTopic, newsCategory } from '@/lib/magazine-payload';
import type { MagazineArticle } from '@/types/magazine';

interface MagazineTypeMetaProps {
  article: MagazineArticle;
  /** Localized, formatted publish date string (already computed by the parent). */
  publishedLabel: string;
}

/**
 * Type-specific header meta rendered directly under the article dates:
 *  - News — a prominent VISIBLE dateline (the `datePublished` GEO freshness
 *    signal) plus a category badge.
 *  - Insider — a topic badge only (NO byline — Insider has no author).
 * Every other type renders nothing. Missing / unknown payloads render nothing
 * without crashing (forward-compat).
 */
export default function MagazineTypeMeta({ article, publishedLabel }: MagazineTypeMetaProps) {
  const { t } = useLanguage();

  if (article.type === 'news') {
    const category = newsCategory(article);
    if (!publishedLabel && !category) return null;
    return (
      <div className="mb-6 flex flex-wrap items-center gap-3" data-testid="magazine-news-meta">
        {publishedLabel && (
          <span
            className="text-[13px] font-semibold uppercase tracking-[2px] text-gold"
            data-testid="magazine-news-dateline"
          >
            <time dateTime={article.published_at ?? undefined}>{publishedLabel}</time>
          </span>
        )}
        {category && (
          <span
            className="rounded-full bg-green-dark px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white"
            data-testid="magazine-news-category"
          >
            {t(`magazine.news_category.${category}`)}
          </span>
        )}
      </div>
    );
  }

  if (article.type === 'insider') {
    const topic = insiderTopic(article);
    if (!topic) return null;
    return (
      <div className="mb-6" data-testid="magazine-insider-meta">
        <span
          className="rounded-full bg-gold/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white"
          data-testid="magazine-insider-topic"
        >
          {t(`magazine.insider_topic.${topic}`)}
        </span>
      </div>
    );
  }

  return null;
}
