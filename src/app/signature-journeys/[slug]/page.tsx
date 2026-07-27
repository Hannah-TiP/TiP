import type { Metadata } from 'next';
import { headers } from 'next/headers';
import SignatureJourneyDetailContent from '@/components/signature-journey/SignatureJourneyDetailContent';
import SignatureJourneyJsonLd from '@/components/signature-journey/SignatureJourneyJsonLd';
import { resolveServerLanguage } from '@/lib/detect-language';
import { getSignatureJourneyBySlugServer } from '@/lib/seo/signature-journey-fetch';
import { absoluteUrl } from '@/lib/seo/locale';
import {
  buildSignatureJourneyMetadata,
  fallbackSignatureJourneyMetadata,
} from '@/lib/seo/signature-journey-metadata';

async function resolveLang() {
  const acceptLanguage = (await headers()).get('accept-language');
  return resolveServerLanguage(acceptLanguage);
}

/**
 * SEO metadata for the signature-journey detail page. Server-fetches the
 * journey by slug (cached — shared with the JSON-LD below), then builds
 * title/description/canonical/OG/Twitter with the meta_ and og_image fallbacks.
 * Degrades to a minimal canonical-only fallback when the fetch fails / 404s.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const lang = await resolveLang();
  const journey = await getSignatureJourneyBySlugServer(slug, lang);

  if (!journey) {
    return fallbackSignatureJourneyMetadata(slug);
  }

  return buildSignatureJourneyMetadata(journey, lang);
}

/**
 * Server Component shell for the Signature Journey detail page.
 *
 * A thin server shell around a 'use client' content island. This shell adds the
 * server-rendered JSON-LD (TouristTrip + BreadcrumbList + FAQPage) via a cached
 * server fetch — the SAME fetch that backs `generateMetadata` — so the
 * structured data matches what the island renders. The island still owns the
 * visible page's data fetching (through the /api proxy) and language-switch
 * re-fetch; this shell does not touch it.
 */
export default async function SignatureJourneyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lang = await resolveLang();
  const journey = await getSignatureJourneyBySlugServer(slug, lang);

  return (
    <>
      {journey && (
        <SignatureJourneyJsonLd
          journey={journey}
          lang={lang}
          canonicalUrl={absoluteUrl(`/signature-journeys/${journey.slug}`)}
        />
      )}
      <SignatureJourneyDetailContent slug={slug} />
    </>
  );
}
