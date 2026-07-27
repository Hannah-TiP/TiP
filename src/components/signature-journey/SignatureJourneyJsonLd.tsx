import type { Lang } from '@/contexts/LanguageContext';
import type { SignatureJourney } from '@/types/signatureJourney';
import { buildSignatureJourneyJsonLd } from '@/lib/seo/signature-journey-jsonld';

interface SignatureJourneyJsonLdProps {
  journey: SignatureJourney;
  lang: Lang;
  canonicalUrl: string;
}

/**
 * Server component emitting the three per-page JSON-LD blocks (TouristTrip,
 * BreadcrumbList, FAQPage) for a signature journey. Rendered in the initial
 * HTML alongside the client island so crawlers/answer-engines see it without
 * running JS. Objects are built and `JSON.stringify`-serialized — never
 * string-concatenated with user content.
 */
export default function SignatureJourneyJsonLd({
  journey,
  lang,
  canonicalUrl,
}: SignatureJourneyJsonLdProps) {
  const docs = buildSignatureJourneyJsonLd(journey, lang, canonicalUrl);

  return (
    <>
      {docs.map((doc, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(doc) }}
        />
      ))}
    </>
  );
}
