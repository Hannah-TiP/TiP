import type { Metadata } from 'next';
import type { Lang } from '@/contexts/LanguageContext';
import { getImageUrl, getLocalizedText } from '@/types/common';
import type { MagazineArticleDetail } from '@/types/magazine';
import { articleCanonicalUrl } from '@/lib/seo/magazine-jsonld';
import { krToOgLocale, localeToHreflang } from '@/lib/seo/locale';

/**
 * Build the Next.js `Metadata` for a published magazine article.
 *
 * Fallback rules (per spec 03_jsonld-templates.md):
 *   title       = seo.meta_title || title
 *   description = seo.meta_description || summary
 *   og image    = seo.og_image || hero_image
 *
 * `alternates.languages` is limited to the article's `available_locales`, each
 * mapped to a BCP-47 hreflang tag (`kr → ko`). OG/Twitter locale uses `ko_KR`.
 * The i18n key stays `kr`; the `kr → ko` conversion happens ONLY here at emit.
 *
 * `metadataBase` is set on the root layout, so the relative canonical resolves
 * against the site origin — but we emit the absolute canonical for clarity.
 */
export function buildMagazineMetadata(detail: MagazineArticleDetail, lang: Lang): Metadata {
  const { article } = detail;

  const title =
    getLocalizedText(article.seo?.meta_title, lang) || getLocalizedText(article.title, lang);
  const description =
    getLocalizedText(article.seo?.meta_description, lang) ||
    getLocalizedText(article.summary, lang);

  const ogImageSource = article.seo?.og_image ?? article.hero_image ?? null;
  const ogImage = ogImageSource ? getImageUrl(ogImageSource) : undefined;

  const canonical = articleCanonicalUrl(article.type, article.slug);

  const languages: Record<string, string> = {};
  for (const locale of detail.available_locales) {
    languages[localeToHreflang(locale)] = canonical;
  }

  const metadata: Metadata = {
    title,
    description,
    alternates: {
      canonical,
      ...(Object.keys(languages).length > 0 ? { languages } : {}),
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'article',
      locale: krToOgLocale(lang),
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };

  return metadata;
}
