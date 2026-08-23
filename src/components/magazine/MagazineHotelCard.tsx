'use client';

import Link from 'next/link';
import CroppedImage from '@/components/hotel/CroppedImage';
import type { Lang } from '@/contexts/LanguageContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getImageUrl, getLocalizedText } from '@/types/common';
import type { ExpandedArticleRelation } from '@/types/magazine';

interface MagazineHotelCardProps {
  /** A ranked or linked relation whose expanded `hotel` target is populated. */
  relation: ExpandedArticleRelation;
  lang: Lang;
  /** Rank badge (1-based) — shown only in the ranked section. */
  rank?: number;
}

/**
 * Shared hotel card used by BOTH the ranked ("where to stay" pillars) and the
 * linked ("also featured") relation sections. Every link derives from the
 * expanded ref (`/hotel/{slug}`, D1 Model A) — never a hand-typed URL. The
 * per-rank blurb + name are localized to the active `lang`.
 */
export default function MagazineHotelCard({ relation, lang, rank }: MagazineHotelCardProps) {
  const { t } = useLanguage();
  const hotel = relation.hotel;
  if (!hotel) return null;

  const name = getLocalizedText(hotel.name, lang) || hotel.slug;
  const blurb = getLocalizedText(relation.blurb, lang);

  return (
    <div
      data-testid="magazine-hotel-card"
      className="flex flex-col gap-4 rounded-2xl border border-gray-border bg-white p-4 sm:flex-row sm:p-5"
    >
      <div className="relative aspect-[4/3] w-full flex-shrink-0 overflow-hidden rounded-xl sm:aspect-square sm:w-40">
        {typeof rank === 'number' && (
          <span
            data-testid="magazine-hotel-rank"
            className="absolute left-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-gold text-[14px] font-semibold text-white"
          >
            {rank}
          </span>
        )}
        <CroppedImage
          src={getImageUrl(hotel.hero_image)}
          crop={hotel.hero_image?.crop}
          alt={name}
          sizes="(max-width: 640px) 100vw, 160px"
        />
      </div>
      <div className="flex flex-1 flex-col">
        <h3 className="font-primary text-[20px] font-semibold text-green-dark md:text-[22px]">
          {name}
        </h3>
        {blurb && (
          <p className="mt-2 whitespace-pre-line text-[14px] leading-relaxed text-gray-text">
            {blurb}
          </p>
        )}
        <Link
          href={`/hotel/${hotel.slug}`}
          data-testid="magazine-hotel-cta"
          className="mt-4 inline-block w-fit rounded-full border border-green-dark px-5 py-2 text-[12px] font-semibold text-green-dark transition-colors hover:bg-green-dark hover:text-white"
        >
          {t('magazine.hotel_cta')}
        </Link>
      </div>
    </div>
  );
}
