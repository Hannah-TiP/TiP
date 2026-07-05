import type { Lang } from '@/contexts/LanguageContext';
import type { Hotel } from '@/types/hotel';
import type { MagazineHotelArticleRef } from '@/types/magazine-hotel';
import type { ReviewWithAuthor } from '@/types/review';
import { buildHotelJsonLdStack } from '@/lib/seo/hotel-jsonld';

interface HotelJsonLdProps {
  hotel: Hotel;
  lang: Lang;
  canonicalUrl: string;
  averageRating: number | null;
  reviewCount: number;
  reviews: ReviewWithAuthor[];
  countryPillar: MagazineHotelArticleRef | null;
}

/**
 * Server component emitting the per-page hotel JSON-LD blocks (Hotel, FAQPage,
 * AggregateRating+Review, BreadcrumbList) into the INITIAL HTML alongside the
 * client island, so crawlers/answer-engines see structured data without running
 * JS. Objects are built and `JSON.stringify`-serialized only — never
 * string-concatenated with user content.
 */
export default function HotelJsonLd({
  hotel,
  lang,
  canonicalUrl,
  averageRating,
  reviewCount,
  reviews,
  countryPillar,
}: HotelJsonLdProps) {
  const docs = buildHotelJsonLdStack({
    hotel,
    lang,
    canonicalUrl,
    averageRating,
    reviewCount,
    reviews,
    countryPillar,
  });

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
