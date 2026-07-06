'use client';

import JourneySectionHeader from '@/components/signature-journey/JourneySectionHeader';
import { getLocalizedText } from '@/types/common';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Inclusion } from '@/types/signatureJourney';

interface JourneyInclusionsProps {
  inclusions: Inclusion[];
}

export default function JourneyInclusions({ inclusions }: JourneyInclusionsProps) {
  const { t, lang } = useLanguage();
  const items = inclusions
    .map((inclusion) => getLocalizedText(inclusion.item, lang))
    .filter((text) => text.length > 0);
  if (items.length === 0) return null;

  return (
    <section
      className="bg-gray-light px-4 py-14 md:px-10 md:py-20"
      data-testid="journey-inclusions"
    >
      <div className="mx-auto max-w-3xl">
        <JourneySectionHeader
          overline={t('signature_journey_detail.inclusions_overline')}
          title={t('signature_journey_detail.inclusions_title')}
        />
        <ul className="rounded-xl bg-white p-6 md:p-8">
          {items.map((text, index) => (
            <li
              key={index}
              className="flex items-start gap-3 border-b border-gray-border py-3 text-[15px] leading-relaxed text-green-dark last:border-b-0"
            >
              <span aria-hidden="true" className="mt-0.5 text-gold">
                ✓
              </span>
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
