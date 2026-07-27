import type { Metadata } from 'next';
import type { Lang } from '@/contexts/LanguageContext';
import { absoluteUrl, krToOgLocale, serverT } from '@/lib/seo/locale';

/**
 * Build the Next.js `Metadata` for the `/magazine` index page. Title +
 * description come from the localized i18n catalog (`magazine.index_*`), the
 * canonical is the absolute `/magazine` URL, and OG/Twitter mirror the same.
 */
export function buildMagazineIndexMetadata(lang: Lang): Metadata {
  const title = serverT('magazine.index_meta_title', lang);
  const description = serverT('magazine.index_meta_description', lang);
  const canonical = absoluteUrl('/magazine');

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'website',
      locale: krToOgLocale(lang),
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}
