'use client';

import JourneySectionHeader from '@/components/signature-journey/JourneySectionHeader';
import { getLocalizedText } from '@/types/common';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Benefit } from '@/types/signatureJourney';

interface JourneyBenefitsProps {
  benefits: Benefit[];
}

export default function JourneyBenefits({ benefits }: JourneyBenefitsProps) {
  const { t, lang } = useLanguage();
  const items = benefits.filter(
    (benefit) =>
      getLocalizedText(benefit.mark, lang) ||
      getLocalizedText(benefit.title, lang) ||
      getLocalizedText(benefit.desc, lang),
  );
  if (items.length === 0) return null;

  return (
    <section className="bg-white px-4 py-14 md:px-10 md:py-20" data-testid="journey-benefits">
      <div className="mx-auto max-w-7xl">
        <JourneySectionHeader
          overline={t('signature_journey_detail.benefits_overline')}
          title={t('signature_journey_detail.benefits_title')}
        />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((benefit, index) => {
            const mark = getLocalizedText(benefit.mark, lang);
            const title = getLocalizedText(benefit.title, lang);
            const desc = getLocalizedText(benefit.desc, lang);
            return (
              <div key={index} className="rounded-xl border border-gray-border p-8">
                {mark && (
                  <span className="text-[11px] font-semibold uppercase tracking-[2px] text-gold">
                    {mark}
                  </span>
                )}
                {title && (
                  <h3
                    className={`font-primary text-[22px] italic leading-snug text-green-dark ${
                      mark ? 'mt-2' : ''
                    }`}
                  >
                    {title}
                  </h3>
                )}
                {desc && <p className="mt-3 text-[14px] leading-[1.8] text-gray-text">{desc}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
