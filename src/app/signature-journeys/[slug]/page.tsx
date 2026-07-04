import SignatureJourneyDetailContent from '@/components/signature-journey/SignatureJourneyDetailContent';

/**
 * Server Component shell for the Signature Journey detail page.
 *
 * Deliberately a thin server shell around a 'use client' content island so
 * SJ-5 (SMA-210) can add `generateMetadata` + server-rendered JSON-LD here
 * without touching the island. The island owns data fetching (through the
 * /api proxy, matching every other detail page) and re-fetches on language
 * switch.
 */
export default async function SignatureJourneyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <SignatureJourneyDetailContent slug={slug} />;
}
