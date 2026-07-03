'use client';

import Image from 'next/image';
import Link from 'next/link';
import { getImageUrl, getLocalizedText } from '@/types/common';
import { useLanguage } from '@/contexts/LanguageContext';
import type { SignatureJourney } from '@/types/signatureJourney';

interface SignatureJourneyCardProps {
  journey: SignatureJourney;
  cityName?: string;
}

export default function SignatureJourneyCard({ journey, cityName }: SignatureJourneyCardProps) {
  const { t } = useLanguage();
  const title = getLocalizedText(journey.title) || journey.slug;

  return (
    <Link
      href={`/signature-journeys/${journey.slug}`}
      data-testid="signature-journey-card"
      className="group overflow-hidden rounded-xl bg-white shadow-sm transition-all hover:shadow-lg"
    >
      <div className="relative h-56 overflow-hidden">
        <Image
          src={getImageUrl(journey.cover_image ?? journey.hero_image)}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, 25vw"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div
          data-testid="signature-journey-pill"
          className="absolute left-3 top-3 rounded-full bg-gold px-3 py-1 text-[10px] font-semibold tracking-wider text-white backdrop-blur-sm"
        >
          {t('signature_journeys.card_pill')}
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-primary text-[18px] font-semibold text-green-dark">{title}</h3>
        {cityName && <p className="mt-1 text-[13px] text-gray-text">{cityName}</p>}
      </div>
    </Link>
  );
}
