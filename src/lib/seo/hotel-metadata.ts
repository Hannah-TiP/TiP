import type { Metadata } from 'next';
import type { Lang } from '@/contexts/LanguageContext';
import { getImageUrl, getLocalizedText } from '@/types/common';
import { getHotelImages, type Hotel } from '@/types/hotel';
import { absoluteUrl, krToOgLocale } from '@/lib/seo/locale';

/**
 * Build the `Metadata` for the hotel detail page from the shipped `Hotel`
 * payload.
 *
 * Fallback rules: `seo.page_title || name`, `seo.meta_description || overview`,
 * `seo.og_image || first image`. The canonical is the computed
 * `/hotel/{slug}` path UNLESS `seo.canonical_url` is set, in which case that
 * per-hotel override wins. `alternates.languages` and the OG locale emit
 * BCP-47 tags (`ko` / `en`) even though the i18n key is `kr`.
 *
 * Draft hotels (the by-slug endpoint returns non-published rows) are emitted
 * with `robots: noindex` so crawlers don't index an unpublished page.
 */
export function buildHotelMetadata(hotel: Hotel, lang: Lang): Metadata {
  const seo = hotel.seo ?? null;

  const name = getLocalizedText(hotel.name, lang) || hotel.slug;
  const title = getLocalizedText(seo?.page_title, lang) || name;
  const description =
    getLocalizedText(seo?.meta_description, lang) || getLocalizedText(hotel.overview, lang);
  const ogTitle = getLocalizedText(seo?.og_title, lang) || title;
  const ogDescription = getLocalizedText(seo?.og_description, lang) || description;

  const ogImageRaw = seo?.og_image ?? hotel.images?.[0] ?? null;
  const ogImage = ogImageRaw ? getImageUrl(ogImageRaw) : getHotelImages(hotel)[0];
  const hasAbsoluteImage = !!ogImage && !ogImage.startsWith('/');

  const path = `/hotel/${hotel.slug}`;
  const computedCanonical = absoluteUrl(path);
  const canonical = seo?.canonical_url || computedCanonical;

  const metadata: Metadata = {
    title,
    description: description || undefined,
    alternates: {
      canonical,
      languages: {
        ko: canonical,
        en: canonical,
      },
    },
    openGraph: {
      type: 'website',
      title: ogTitle,
      description: ogDescription || undefined,
      url: canonical,
      locale: krToOgLocale(lang),
      alternateLocale: [lang === 'kr' ? 'en_US' : 'ko_KR'],
      images: hasAbsoluteImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: hasAbsoluteImage ? 'summary_large_image' : 'summary',
      title: ogTitle,
      description: ogDescription || undefined,
      images: hasAbsoluteImage ? [ogImage] : undefined,
    },
  };

  if (hotel.status !== 'published') {
    metadata.robots = { index: false, follow: false };
  }

  return metadata;
}

/**
 * Minimal fallback metadata when the by-slug fetch fails / 404s — keeps the
 * page from 500-ing and gives crawlers a canonical without leaking a broken
 * title.
 */
export function fallbackHotelMetadata(slug: string): Metadata {
  const path = `/hotel/${slug}`;
  return {
    alternates: { canonical: path },
  };
}
