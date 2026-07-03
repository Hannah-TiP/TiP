'use client';

import JourneySectionHeader from '@/components/signature-journey/JourneySectionHeader';
import { getLocalizedText } from '@/types/common';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Highlight } from '@/types/signatureJourney';

interface JourneyHighlightsProps {
  highlights: Highlight[];
}

export default function JourneyHighlights({ highlights }: JourneyHighlightsProps) {
  const { t } = useLanguage();
  const items = highlights.filter(
    (highlight) => getLocalizedText(highlight.title) || getLocalizedText(highlight.desc),
  );
  if (items.length === 0) return null;

  return (
    <section
      className="bg-gray-light px-4 py-14 md:px-10 md:py-20"
      data-testid="journey-highlights"
    >
      <div className="mx-auto max-w-7xl">
        <JourneySectionHeader
          overline={t('signature_journey_detail.highlights_overline')}
          title={t('signature_journey_detail.highlights_title')}
        />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((highlight, index) => {
            const title = getLocalizedText(highlight.title);
            const desc = getLocalizedText(highlight.desc);
            return (
              <div key={index} className="rounded-xl bg-white p-8 shadow-sm">
                {title && (
                  <h3 className="font-primary text-[22px] italic leading-snug text-green-dark">
                    {title}
                  </h3>
                )}
                {desc && (
                  <p className={`text-[14px] leading-[1.8] text-gray-text ${title ? 'mt-3' : ''}`}>
                    {desc}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
