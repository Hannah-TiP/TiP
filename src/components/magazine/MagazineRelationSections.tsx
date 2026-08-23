'use client';

import Link from 'next/link';
import CroppedImage from '@/components/hotel/CroppedImage';
import { useLanguage } from '@/contexts/LanguageContext';
import { getImageUrl, getLocalizedText } from '@/types/common';
import {
  linkedHotelRelations,
  parentArticleRelation,
  rankedHotelRelations,
} from '@/lib/magazine-relations';
import { TYPE_ENUM_TO_SEGMENT } from '@/types/magazine';
import type { ExpandedArticleRelation, MagazineRelationArticleRef } from '@/types/magazine';
import MagazineHotelCard from '@/components/magazine/MagazineHotelCard';

interface MagazineRelationSectionsProps {
  relations: ExpandedArticleRelation[];
  related: MagazineRelationArticleRef[];
}

/**
 * Renders the four relation-driven blocks of a magazine article:
 *  - cluster up-link (a `kind==='parent'` relation)
 *  - ranked hotels ("where to stay" pillars, position-ordered)
 *  - linked hotels ("also featured")
 *  - related stories (from the auto-computed + manual-merged `related[]` list)
 *
 * Every block hides when its source is empty and never crashes on missing /
 * unknown relations (same forward-compat rule as the body blocks).
 */
export default function MagazineRelationSections({
  relations,
  related,
}: MagazineRelationSectionsProps) {
  const { t, lang } = useLanguage();

  const parent = parentArticleRelation(relations);
  const ranked = rankedHotelRelations(relations);
  const linked = linkedHotelRelations(relations);

  const hasAnything =
    parent !== null || ranked.length > 0 || linked.length > 0 || related.length > 0;
  if (!hasAnything) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 pb-6 md:px-10">
      {/* Cluster up-link */}
      {parent && (
        <Link
          href={`/magazine/${TYPE_ENUM_TO_SEGMENT[parent.type]}/${parent.slug}`}
          data-testid="magazine-parent-uplink"
          className="mb-10 flex items-center gap-2 text-[13px] font-semibold text-gold transition-colors hover:text-green-dark"
        >
          <span aria-hidden="true">←</span>
          <span>
            {t('magazine.part_of_series')} {getLocalizedText(parent.title, lang) || parent.slug}
          </span>
        </Link>
      )}

      {/* Ranked hotels */}
      {ranked.length > 0 && (
        <section className="mb-12" data-testid="magazine-ranked">
          <h2 className="mb-6 text-[11px] font-semibold uppercase tracking-[4px] text-gold">
            {t('magazine.where_to_stay')}
          </h2>
          <ol className="space-y-4">
            {ranked.map((relation, index) => (
              <li key={relation.id ?? relation.target_id}>
                <MagazineHotelCard relation={relation} lang={lang} rank={index + 1} />
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Linked hotels */}
      {linked.length > 0 && (
        <section className="mb-12" data-testid="magazine-linked">
          <h2 className="mb-6 text-[11px] font-semibold uppercase tracking-[4px] text-gold">
            {t('magazine.also_featured')}
          </h2>
          <div className="space-y-4">
            {linked.map((relation) => (
              <MagazineHotelCard
                key={relation.id ?? relation.target_id}
                relation={relation}
                lang={lang}
              />
            ))}
          </div>
        </section>
      )}

      {/* Related stories */}
      {related.length > 0 && (
        <section className="mb-12" data-testid="magazine-related">
          <h2 className="mb-6 text-[11px] font-semibold uppercase tracking-[4px] text-gold">
            {t('magazine.related_stories')}
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((story) => {
              const storyTitle = getLocalizedText(story.title, lang) || story.slug;
              return (
                <Link
                  key={story.id}
                  href={`/magazine/${TYPE_ENUM_TO_SEGMENT[story.type]}/${story.slug}`}
                  data-testid="magazine-related-card"
                  className="group overflow-hidden rounded-xl bg-white shadow-sm transition-all hover:shadow-lg"
                >
                  <div className="relative h-40 overflow-hidden">
                    <CroppedImage
                      src={getImageUrl(story.hero_image)}
                      crop={story.hero_image?.crop}
                      alt={storyTitle}
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute left-3 top-3 rounded-full bg-gold/90 px-3 py-1 text-[9px] font-semibold uppercase tracking-wider text-white">
                      {t(`magazine.type_badge.${story.type}`)}
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-primary text-[16px] font-semibold text-green-dark">
                      {storyTitle}
                    </h3>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
