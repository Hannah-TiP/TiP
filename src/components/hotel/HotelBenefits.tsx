'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { getLocalizedText } from '@/types/common';
import type { HotelBenefitProgram } from '@/types/hotel';

interface HotelBenefitsProps {
  benefits?: HotelBenefitProgram[] | null;
}

export default function HotelBenefits({ benefits }: HotelBenefitsProps) {
  const { t } = useLanguage();

  const flatBenefits = (benefits ?? []).flatMap((program) =>
    program.benefits.map((benefit) => getLocalizedText(benefit)).filter(Boolean),
  );

  if (flatBenefits.length === 0) return null;

  return (
    <div
      className="mb-14 bg-gradient-to-br from-green-dark to-[#152b22] p-5 text-[13px] leading-[1.7] text-white md:p-7"
      role="complementary"
      aria-label={t('hotel.booking_benefits_title')}
    >
      <p className="font-semibold uppercase tracking-[1.5px] text-gold">
        ✦ {t('hotel.booking_benefits_title')}
      </p>
      <ul className="mt-3 list-disc space-y-1 pl-5">
        {flatBenefits.map((benefit, index) => (
          <li key={index} className="text-white/85">
            {benefit}
          </li>
        ))}
      </ul>
    </div>
  );
}
