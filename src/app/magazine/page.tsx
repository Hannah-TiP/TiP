import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { Suspense } from 'react';
import type { Lang } from '@/contexts/LanguageContext';
import { resolveServerLanguage } from '@/lib/detect-language';
import { getMagazineIndexFirstPage } from '@/lib/seo/magazine-fetch';
import { buildMagazineIndexMetadata } from '@/lib/seo/magazine-index-metadata';
import MagazineIndexIsland from '@/components/magazine/MagazineIndexIsland';

async function resolveRequestLang(): Promise<Lang> {
  const acceptLanguage = (await headers()).get('accept-language');
  return resolveServerLanguage(acceptLanguage);
}

export async function generateMetadata(): Promise<Metadata> {
  const lang = await resolveRequestLang();
  return buildMagazineIndexMetadata(lang);
}

/**
 * Server-component shell for the magazine index. Server-fetches the unfiltered
 * first page for crawlable initial HTML, then hands off to the client filter
 * island (wrapped in Suspense for `useSearchParams`).
 */
export default async function MagazineIndexPage() {
  const lang = await resolveRequestLang();
  const initialArticles = await getMagazineIndexFirstPage(lang);

  return (
    <Suspense>
      <MagazineIndexIsland initialArticles={initialArticles} />
    </Suspense>
  );
}
