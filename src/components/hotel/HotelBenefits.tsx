'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import BenefitGroupList from '@/components/hotel/BenefitGroupList';
import { buildEligibilityTemplates, groupBenefitPrograms } from '@/lib/hotel-benefits';
import type { HotelBenefitProgram } from '@/types/hotel';

interface HotelBenefitsProps {
  benefits?: HotelBenefitProgram[] | null;
}

export default function HotelBenefits({ benefits }: HotelBenefitsProps) {
  const { t, lang } = useLanguage();

  // No stay-date context here, so every date-bounded program carries its
  // "valid …" label on the group heading.
  const groups = groupBenefitPrograms(
    benefits,
    lang,
    buildEligibilityTemplates((key) => t(key as Parameters<typeof t>[0])),
  );

  if (groups.length === 0) return null;

  return (
    <div
      className="mb-14 bg-gradient-to-br from-green-dark to-[#152b22] p-5 text-[13px] leading-[1.7] text-white md:p-7"
      role="complementary"
      aria-label={t('hotel.booking_benefits_title')}
    >
      <p className="font-semibold uppercase tracking-[1.5px] text-gold">
        ✦ {t('hotel.booking_benefits_title')}
      </p>
      <BenefitGroupList groups={groups} />
    </div>
  );
}
