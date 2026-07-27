'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { getImageUrl, getLocalizedText } from '@/types/common';
import { TYPE_ENUM_TO_SEGMENT } from '@/types/magazine';
import type { MagazineHotelArticleRef } from '@/types/magazine-hotel';

interface FromTheMagazineProps {
  featured: MagazineHotelArticleRef[];
}

/**
 * "From the Magazine" backlink section for the hotel detail page. Renders the
 * hotel's featured magazine articles as cards (title, hero image, type badge)
 * linking to `/magazine/{type}/{slug}`. Hidden entirely when `featured` is
 * empty. Card styling mirrors the magazine "Related stories" grid.
 */
export default function FromTheMagazine({ featured }: FromTheMagazineProps) {
  const { t, lang } = useLanguage();

  if (featured.length === 0) return null;

  return (
    <section
      aria-labelledby="from-magazine-title"
      data-testid="from-the-magazine"
      className="mb-8 md:mb-14"
    >
      <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[4px] text-gold">
        {t('hotel.from_magazine_overline')}
      </span>
      <h2
        id="from-magazine-title"
        className="mb-6 font-primary text-[28px] italic text-green-dark md:text-[32px]"
      >
        {t('hotel.from_magazine_title')}
      </h2>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {featured.map((article) => {
          const title = getLocalizedText(article.title, lang) || article.slug;
          return (
            <Link
              key={article.id}
              href={`/magazine/${TYPE_ENUM_TO_SEGMENT[article.type]}/${article.slug}`}
              data-testid="from-magazine-card"
              className="group overflow-hidden rounded-xl bg-white shadow-sm transition-all hover:shadow-lg"
            >
              <div className="relative h-40 overflow-hidden">
                <Image
                  src={getImageUrl(article.hero_image)}
                  alt={title}
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute left-3 top-3 rounded-full bg-gold/90 px-3 py-1 text-[9px] font-semibold uppercase tracking-wider text-white">
                  {t(`magazine.type_badge.${article.type}`)}
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-primary text-[16px] font-semibold text-green-dark">{title}</h3>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
