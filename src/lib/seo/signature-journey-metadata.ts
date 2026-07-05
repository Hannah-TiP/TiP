import type { Metadata } from 'next';
import type { Lang } from '@/contexts/LanguageContext';
import { getImageUrl, getLocalizedText } from '@/types/common';
import type { SignatureJourney } from '@/types/signatureJourney';
import { absoluteUrl, krToOgLocale } from '@/lib/seo/locale';

/**
 * Build the `Metadata` for the signature-journey detail page from the shipped
 * `SignatureJourney` payload.
 *
 * Fallback rules: `meta_title || title`, `meta_description || description`,
 * `og_image || cover_image`. Canonical + `og:url` use the real publish domain
 * (via the root layout's `metadataBase`) plus `/signature-journeys/{slug}`.
 * `alternates.languages` and the OG locale/alternateLocale emit BCP-47 tags
 * (`ko` / `en`) even though the i18n key is `kr`.
 */
export function buildSignatureJourneyMetadata(journey: SignatureJourney, lang: Lang): Metadata {
  const title = getLocalizedText(journey.meta_title, lang) || getLocalizedText(journey.title, lang);
  const description =
    getLocalizedText(journey.meta_description, lang) || getLocalizedText(journey.description, lang);

  const ogImageRaw = journey.og_image ?? journey.cover_image;
  const ogImage = ogImageRaw ? getImageUrl(ogImageRaw) : '';
  const hasAbsoluteImage = !!ogImage && !ogImage.startsWith('/');

  const path = `/signature-journeys/${journey.slug}`;
  const canonical = absoluteUrl(path);

  const resolvedTitle = title || journey.slug;

  return {
    title: resolvedTitle,
    description: description || undefined,
    alternates: {
      canonical: path,
      languages: {
        ko: path,
        en: path,
      },
    },
    openGraph: {
      type: 'website',
      title: resolvedTitle,
      description: description || undefined,
      url: canonical,
      locale: krToOgLocale(lang),
      alternateLocale: [lang === 'kr' ? 'en_US' : 'ko_KR'],
      images: hasAbsoluteImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: resolvedTitle,
      description: description || undefined,
      images: hasAbsoluteImage ? [ogImage] : undefined,
    },
  };
}

/**
 * Minimal fallback metadata when the by-slug fetch fails / 404s — keeps the
 * page from 500-ing and gives crawlers a canonical without leaking a broken
 * title.
 */
export function fallbackSignatureJourneyMetadata(slug: string): Metadata {
  const path = `/signature-journeys/${slug}`;
  return {
    alternates: { canonical: path },
  };
}
