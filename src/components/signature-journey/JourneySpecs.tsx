'use client';

import JourneySectionHeader from '@/components/signature-journey/JourneySectionHeader';
import { getLocalizedText } from '@/types/common';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Spec } from '@/types/signatureJourney';

interface JourneySpecsProps {
  specs: Spec[];
}

export default function JourneySpecs({ specs }: JourneySpecsProps) {
  const { t, lang } = useLanguage();
  const items = specs.filter(
    (spec) => getLocalizedText(spec.key, lang) || getLocalizedText(spec.value, lang),
  );
  if (items.length === 0) return null;

  return (
    <section className="bg-white px-4 py-14 md:px-10 md:py-20" data-testid="journey-specs">
      <div className="mx-auto max-w-5xl">
        <JourneySectionHeader
          overline={t('signature_journey_detail.specs_overline')}
          title={t('signature_journey_detail.specs_title')}
        />
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((spec, index) => (
            <div key={index} className="rounded-xl bg-gray-light p-6">
              <dt className="text-[11px] font-semibold uppercase tracking-[2px] text-gold">
                {getLocalizedText(spec.key, lang)}
              </dt>
              <dd className="mt-2 text-[15px] leading-relaxed text-green-dark">
                {getLocalizedText(spec.value, lang)}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
