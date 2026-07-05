import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import type { Lang } from '@/contexts/LanguageContext';
import { resolveServerLanguage } from '@/lib/detect-language';
import { getMagazineArticleServer } from '@/lib/seo/magazine-fetch';
import { buildMagazineMetadata } from '@/lib/seo/magazine-metadata';
import { typeEnumFromSegment } from '@/types/magazine';
import MagazineArticleContent from '@/components/magazine/MagazineArticleContent';
import MagazineJsonLd from '@/components/magazine/MagazineJsonLd';

type RouteParams = { type: string; slug: string };

/**
 * Resolve the SSR language for this request from the `Accept-Language` header —
 * the same signal the root layout uses for first paint, so metadata / JSON-LD /
 * the content island all agree on locale before hydration.
 */
async function resolveRequestLang(): Promise<Lang> {
  const acceptLanguage = (await headers()).get('accept-language');
  return resolveServerLanguage(acceptLanguage);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { type, slug } = await params;
  const typeEnum = typeEnumFromSegment(type);
  if (!typeEnum) return {};

  const lang = await resolveRequestLang();
  const detail = await getMagazineArticleServer(typeEnum, slug, lang);
  if (!detail) return {};

  return buildMagazineMetadata(detail, lang);
}

/**
 * Server-component shell for a magazine article page. Validates the plural URL
 * segment, resolves language, fetches the published article (shared with
 * `generateMetadata` via a React `cache()`d fetcher), 404s on any failure, then
 * server-renders the JSON-LD stack + the client content island.
 */
export default async function MagazineArticlePage({ params }: { params: Promise<RouteParams> }) {
  const { type, slug } = await params;

  const typeEnum = typeEnumFromSegment(type);
  if (!typeEnum) notFound();

  const lang = await resolveRequestLang();
  const detail = await getMagazineArticleServer(typeEnum, slug, lang);
  if (!detail) notFound();

  return (
    <>
      <MagazineJsonLd detail={detail} lang={lang} />
      <MagazineArticleContent detail={detail} />
    </>
  );
}
