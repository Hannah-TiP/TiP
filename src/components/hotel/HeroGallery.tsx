'use client';

import Image from 'next/image';

interface HeroGalleryProps {
  images: string[];
  hotelName: string;
  subtitle?: string;
  starRating?: string | null;
  showTipCertified?: boolean;
  tipCertifiedLabel: string;
}

function starBadge(starRating: string): string | null {
  // star_rating values come in shapes like "5", "5-star", "luxury".
  const match = starRating.match(/(\d)/);
  if (!match) return null;
  const count = Math.min(5, Math.max(1, parseInt(match[1], 10)));
  return '★'.repeat(count);
}

export default function HeroGallery({
  images,
  hotelName,
  subtitle,
  starRating,
  showTipCertified,
  tipCertifiedLabel,
}: HeroGalleryProps) {
  const heroImage = images[0];
  const secondImage = images[1];
  const thirdImage = images[2];

  const stars = starRating ? starBadge(starRating) : null;

  return (
    <section className="relative h-[60vh] min-h-[440px] w-full overflow-hidden md:h-[80vh]">
      <div className="grid h-full grid-cols-1 gap-1 md:grid-cols-[2fr_1fr] md:grid-rows-2">
        <div className="relative md:row-span-2">
          <Image
            src={heroImage}
            alt={hotelName}
            fill
            sizes="(max-width: 768px) 100vw, 66vw"
            className="object-cover"
            priority
          />
        </div>
        {secondImage && (
          <div className="relative hidden md:block">
            <Image
              src={secondImage}
              alt={`${hotelName} interior`}
              fill
              sizes="33vw"
              className="object-cover"
            />
          </div>
        )}
        {thirdImage && (
          <div className="relative hidden md:block">
            <Image
              src={thirdImage}
              alt={`${hotelName} detail`}
              fill
              sizes="33vw"
              className="object-cover"
            />
          </div>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-10 pb-12 pt-20 text-white">
        <div className="mx-auto max-w-7xl">
          {(stars || showTipCertified) && (
            <div className="mb-4 flex flex-wrap gap-2">
              {stars && (
                <span className="inline-block bg-gold px-3 py-1 text-[11px] uppercase tracking-[2px] text-white">
                  {stars}
                </span>
              )}
              {showTipCertified && (
                <span className="inline-block border border-white/60 px-3 py-1 text-[11px] uppercase tracking-[2px] text-white">
                  {tipCertifiedLabel}
                </span>
              )}
            </div>
          )}
          <h1 className="font-primary text-[44px] font-light leading-tight md:text-[72px]">
            {hotelName}
          </h1>
          {subtitle && (
            <p className="mt-3 text-[14px] tracking-[1.5px] text-white/75">{subtitle}</p>
          )}
        </div>
      </div>
    </section>
  );
}
