import { getLocalizedText } from '@/types/common';
import { TYPE_ENUM_TO_SEGMENT, type MagazineArticle } from '@/types/magazine';
import { absoluteUrl } from '@/lib/seo/locale';
import { TRAVEL_AGENCY_DESCRIPTION } from '@/lib/seo/signature-journey-jsonld';

/**
 * Build the `/llms.txt` markdown document (llmstxt.org convention, EN).
 *
 * Structure:
 *   # <entity name>
 *   > <one-liner — BYTE-IDENTICAL to the TravelAgency `description`>
 *   (entity facts: Paris Class parent, Virtuoso member, IATA)
 *   ## Explore  — key section links (magazine / dream-hotels / signature-journeys)
 *   ## Destination Guides — dynamically generated list of published Destination
 *      pillar articles (title + absolute URL)
 *
 * `destinationArticles` are the published `type=destination` articles; each is
 * rendered as a markdown link. Articles without a usable title are skipped.
 */
export function buildLlmsTxt(destinationArticles: MagazineArticle[]): string {
  const lines: string[] = [];

  lines.push('# Travel in Your Pocket (TiP)');
  lines.push('');
  lines.push(`> ${TRAVEL_AGENCY_DESCRIPTION}`);
  lines.push('');
  lines.push('- Parent organization: Paris Class (https://parisclass.com)');
  lines.push('- Virtuoso member agency');
  lines.push('- IATA: 17335835');
  lines.push('');
  lines.push('## Explore');
  lines.push('');
  lines.push(`- [Magazine](${absoluteUrl('/magazine')})`);
  lines.push(`- [Dream Hotels](${absoluteUrl('/dream-hotels')})`);
  lines.push(`- [Signature Journeys](${absoluteUrl('/signature-journeys')})`);
  lines.push('');
  lines.push('## Destination Guides');
  lines.push('');

  const segment = TYPE_ENUM_TO_SEGMENT.destination;
  const guideLines = destinationArticles
    .map((article) => {
      const title = getLocalizedText(article.title, 'en');
      if (!title) return null;
      return `- [${title}](${absoluteUrl(`/magazine/${segment}/${article.slug}`)})`;
    })
    .filter((line): line is string => line !== null);

  lines.push(...guideLines);

  return lines.join('\n').trimEnd() + '\n';
}
