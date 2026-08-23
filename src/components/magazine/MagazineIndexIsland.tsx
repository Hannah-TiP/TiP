'use client';

import { useCallback, useMemo, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Footer from '@/components/Footer';
import CroppedImage from '@/components/hotel/CroppedImage';
import { apiClient } from '@/lib/api-client';
import { useLanguage, type TranslationKeys } from '@/contexts/LanguageContext';
import { useInfiniteList } from '@/lib/use-infinite-list';
import { getImageUrl, getLocalizedText } from '@/types/common';
import {
  TYPE_SEGMENT_TO_ENUM,
  TYPE_ENUM_TO_SEGMENT,
  type MagazineArticle,
  type MagazineArticleType,
  type MagazineFacetOptions,
} from '@/types/magazine';

/** The five plural type segments (source of truth for the tab row). */
const TYPE_SEGMENTS = Object.keys(TYPE_SEGMENT_TO_ENUM);

const ARTICLES_PER_PAGE = 12;

function typeTabLabelKey(segment: string): TranslationKeys {
  return `magazine.type_tab.${segment}` as TranslationKeys;
}

function typeBadgeKey(type: MagazineArticleType): TranslationKeys {
  return `magazine.type_badge.${type}` as TranslationKeys;
}

function formatDate(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

interface MagazineIndexIslandProps {
  initialArticles: MagazineArticle[];
}

export default function MagazineIndexIsland({ initialArticles }: MagazineIndexIslandProps) {
  const { t, lang } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();

  // ── Filter state, seeded from URL query params (shareable / back-safe) ──
  const initialSegment = searchParams.get('type') ?? '';
  const [typeSegment, setTypeSegment] = useState(
    initialSegment in TYPE_SEGMENT_TO_ENUM ? initialSegment : '',
  );
  const [countryId, setCountryId] = useState<number | null>(
    searchParams.get('country_id') ? Number(searchParams.get('country_id')) : null,
  );
  const [cityId, setCityId] = useState<number | null>(
    searchParams.get('city_id') ? Number(searchParams.get('city_id')) : null,
  );
  const [brandId, setBrandId] = useState<number | null>(
    searchParams.get('brand_id') ? Number(searchParams.get('brand_id')) : null,
  );
  const [tag, setTag] = useState<string | null>(searchParams.get('tag'));

  const [facets, setFacets] = useState<MagazineFacetOptions | null>(null);

  const typeEnum: MagazineArticleType | null = typeSegment
    ? TYPE_SEGMENT_TO_ENUM[typeSegment]
    : null;

  // Sync active filters into the URL query string (replace, not push, so the
  // back button leaves the page rather than stepping through every filter).
  useEffect(() => {
    const params = new URLSearchParams();
    if (typeSegment) params.set('type', typeSegment);
    if (countryId != null) params.set('country_id', String(countryId));
    if (cityId != null) params.set('city_id', String(cityId));
    if (brandId != null) params.set('brand_id', String(brandId));
    if (tag) params.set('tag', tag);
    const query = params.toString();
    router.replace(query ? `/magazine?${query}` : '/magazine', { scroll: false });
  }, [typeSegment, countryId, cityId, brandId, tag, router]);

  // Load facet options once (language-keyed for localized labels).
  useEffect(() => {
    let cancelled = false;
    apiClient
      .getMagazineFacets(lang)
      .then((data) => {
        if (!cancelled) setFacets(data);
      })
      .catch((error) => console.error('Failed to load magazine facets:', error));
    return () => {
      cancelled = true;
    };
  }, [lang]);

  const fetchPage = useCallback(
    (page: number) =>
      apiClient.getMagazineArticles({
        type: typeEnum,
        country_id: countryId,
        city_id: cityId,
        brand_id: brandId,
        tag,
        language: lang,
        page,
        per_page: ARTICLES_PER_PAGE,
      }),
    [typeEnum, countryId, cityId, brandId, tag, lang],
  );

  const deps = [typeEnum, countryId, cityId, brandId, tag, lang];

  const {
    items: fetchedArticles,
    isLoading,
    isLoadingMore,
    hasMore,
    sentinelRef,
  } = useInfiniteList<MagazineArticle>(fetchPage, deps);

  // Use the crawlable server-seeded first page until the client fetch resolves
  // AND no filter is active, so the initial paint has content immediately.
  const noFilterActive =
    !typeSegment && countryId == null && cityId == null && brandId == null && !tag;
  const articles = fetchedArticles.length > 0 || !isLoading ? fetchedArticles : [];
  const displayed =
    articles.length === 0 && noFilterActive && isLoading ? initialArticles : articles;

  const hasActiveFilters = !noFilterActive;

  const clearFilters = useCallback(() => {
    setTypeSegment('');
    setCountryId(null);
    setCityId(null);
    setBrandId(null);
    setTag(null);
  }, []);

  const countryOptions = facets?.countries ?? [];
  const cityOptions = facets?.cities ?? [];
  const brandOptions = facets?.brands ?? [];
  const tagOptions = useMemo(() => facets?.tags ?? [], [facets]);

  return (
    <main className="min-h-screen bg-gray-light">
      {/* Hero */}
      <section className="bg-green-dark px-6 py-20 text-center sm:px-10 lg:px-20">
        <span className="text-[11px] font-semibold tracking-[4px] text-gold">
          {t('magazine.index_eyebrow')}
        </span>
        <h1 className="mt-3 font-primary text-[36px] italic text-[#FAF5EF] md:text-[48px] lg:text-[56px]">
          {t('magazine.index_title')}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-[16px] leading-relaxed text-white/60">
          {t('magazine.index_subtitle')}
        </p>
      </section>

      {/* Filters */}
      <section className="bg-white px-6 py-8 sm:px-10 lg:px-20">
        {/* Type tabs */}
        <div
          className="flex flex-wrap gap-2"
          role="tablist"
          aria-label={t('magazine.index_eyebrow')}
        >
          <button
            type="button"
            role="tab"
            aria-selected={typeSegment === ''}
            data-testid="magazine-type-tab-all"
            onClick={() => setTypeSegment('')}
            className={`rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${
              typeSegment === ''
                ? 'bg-green-dark text-white'
                : 'bg-gray-100 text-green-dark hover:bg-gray-200'
            }`}
          >
            {t('magazine.filter_all')}
          </button>
          {TYPE_SEGMENTS.map((segment) => (
            <button
              key={segment}
              type="button"
              role="tab"
              aria-selected={typeSegment === segment}
              data-testid={`magazine-type-tab-${segment}`}
              onClick={() => setTypeSegment(segment)}
              className={`rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${
                typeSegment === segment
                  ? 'bg-green-dark text-white'
                  : 'bg-gray-100 text-green-dark hover:bg-gray-200'
              }`}
            >
              {t(typeTabLabelKey(segment))}
            </button>
          ))}
        </div>

        {/* Facet selects */}
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-gray-400">
              {t('magazine.filter_country')}
            </span>
            <select
              value={countryId ?? ''}
              onChange={(e) => setCountryId(e.target.value ? Number(e.target.value) : null)}
              className="w-full rounded-lg border border-gray-border bg-white px-3 py-2.5 text-[14px] text-green-dark outline-none focus:border-gold"
            >
              <option value="">{t('magazine.filter_all_countries')}</option>
              {countryOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {getLocalizedText(option.name, lang)}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-gray-400">
              {t('magazine.filter_city')}
            </span>
            <select
              value={cityId ?? ''}
              onChange={(e) => setCityId(e.target.value ? Number(e.target.value) : null)}
              className="w-full rounded-lg border border-gray-border bg-white px-3 py-2.5 text-[14px] text-green-dark outline-none focus:border-gold"
            >
              <option value="">{t('magazine.filter_all_cities')}</option>
              {cityOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {getLocalizedText(option.name, lang)}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-gray-400">
              {t('magazine.filter_brand')}
            </span>
            <select
              value={brandId ?? ''}
              onChange={(e) => setBrandId(e.target.value ? Number(e.target.value) : null)}
              className="w-full rounded-lg border border-gray-border bg-white px-3 py-2.5 text-[14px] text-green-dark outline-none focus:border-gold"
            >
              <option value="">{t('magazine.filter_all_brands')}</option>
              {brandOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {getLocalizedText(option.name, lang)}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Tag chips (multi-select is single-active per the list contract) */}
        {tagOptions.length > 0 && (
          <div className="mt-5">
            <span className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-gray-400">
              {t('magazine.filter_tags_label')}
            </span>
            <div className="flex flex-wrap gap-2">
              {tagOptions.map((option) => {
                const label = getLocalizedText(option, lang);
                const value = option.en || option.kr || '';
                const active = tag === value;
                return (
                  <button
                    key={value}
                    type="button"
                    data-testid="magazine-tag-chip"
                    onClick={() => setTag(active ? null : value)}
                    className={`rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors ${
                      active
                        ? 'border-gold bg-gold/10 text-gold'
                        : 'border-gray-border text-green-dark hover:border-gray-400'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="mt-5 text-[13px] font-medium text-gold underline hover:no-underline"
          >
            {t('magazine.clear_filters')}
          </button>
        )}
      </section>

      {/* Article grid */}
      <section className="bg-gray-light px-6 py-14 sm:px-10 lg:px-20">
        {isLoading && displayed.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-green-dark border-t-transparent" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="py-20 text-center" data-testid="magazine-empty">
            <p className="text-gray-text">
              {hasActiveFilters ? t('magazine.empty_no_match') : t('magazine.empty_none')}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 text-[14px] font-medium text-gold underline hover:no-underline"
              >
                {t('magazine.clear_filters')}
              </button>
            )}
          </div>
        ) : (
          <>
            <div
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
              data-testid="magazine-grid"
            >
              {displayed.map((article) => (
                <Link
                  key={article.id}
                  href={`/magazine/${TYPE_ENUM_TO_SEGMENT[article.type]}/${article.slug}`}
                  className="group overflow-hidden rounded-xl bg-white shadow-sm transition-all hover:shadow-lg"
                >
                  <div className="relative h-52 overflow-hidden bg-gray-100">
                    {article.hero_image && (
                      <CroppedImage
                        src={getImageUrl(article.hero_image)}
                        crop={article.hero_image.crop}
                        alt={
                          getLocalizedText(article.hero_alt, lang) ||
                          getLocalizedText(article.title, lang)
                        }
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                    <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-green-dark backdrop-blur-sm">
                      {t(typeBadgeKey(article.type))}
                    </div>
                  </div>
                  <div className="p-5">
                    <h2 className="font-primary text-[20px] font-semibold text-green-dark">
                      {getLocalizedText(article.title, lang)}
                    </h2>
                    {getLocalizedText(article.summary, lang) && (
                      <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-gray-text">
                        {getLocalizedText(article.summary, lang)}
                      </p>
                    )}
                    {formatDate(article.published_at) && (
                      <p className="mt-3 text-[11px] uppercase tracking-wider text-gray-400">
                        {formatDate(article.published_at)}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            <div ref={sentinelRef} data-testid="magazine-sentinel" aria-hidden="true" />
            {isLoadingMore && (
              <div className="flex items-center justify-center gap-3 pt-10 text-[13px] text-gray-text">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-green-dark border-t-transparent" />
                {t('magazine.loading_more')}
              </div>
            )}
            {!hasMore && !isLoadingMore && displayed.length > 0 && (
              <p className="pt-10 text-center text-[13px] text-gray-text">
                {t('magazine.no_more_results')}
              </p>
            )}
          </>
        )}
      </section>

      <Footer />
    </main>
  );
}
