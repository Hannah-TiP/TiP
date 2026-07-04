import type { Lang } from '@/contexts/LanguageContext';
import type { MagazineArticleDetail } from '@/types/magazine';
import { buildMagazineJsonLd } from '@/lib/seo/magazine-jsonld';

interface MagazineJsonLdProps {
  detail: MagazineArticleDetail;
  lang: Lang;
}

/**
 * Server component that emits the base JSON-LD stack (Article + FAQPage +
 * BreadcrumbList) as `<script type="application/ld+json">` blocks in the INITIAL
 * HTML (View-Source visible, not CSR).
 *
 * Each node is serialized with `JSON.stringify` ONLY — content is never
 * string-concatenated into the script, so it is injection-safe.
 */
export default function MagazineJsonLd({ detail, lang }: MagazineJsonLdProps) {
  const nodes = buildMagazineJsonLd(detail, lang);

  return (
    <>
      {nodes.map((node, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(node) }}
        />
      ))}
    </>
  );
}
