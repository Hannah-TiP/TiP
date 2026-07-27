'use client';

import CroppedImage from '@/components/hotel/CroppedImage';
import JourneySectionHeader from '@/components/signature-journey/JourneySectionHeader';
import { getImageUrl, getLocalizedText } from '@/types/common';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Unit } from '@/types/signatureJourney';

interface JourneyUnitsProps {
  units: Unit[];
}

export default function JourneyUnits({ units }: JourneyUnitsProps) {
  const { t, lang } = useLanguage();
  const items = units.filter(
    (unit) =>
      unit.image ||
      getLocalizedText(unit.name, lang) ||
      getLocalizedText(unit.spec, lang) ||
      getLocalizedText(unit.desc, lang),
  );
  if (items.length === 0) return null;

  return (
    <section className="bg-white px-4 py-14 md:px-10 md:py-20" data-testid="journey-units">
      <div className="mx-auto max-w-7xl">
        <JourneySectionHeader
          overline={t('signature_journey_detail.units_overline')}
          title={t('signature_journey_detail.units_title')}
        />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((unit, index) => {
            const name = getLocalizedText(unit.name, lang);
            const spec = getLocalizedText(unit.spec, lang);
            const desc = getLocalizedText(unit.desc, lang);
            return (
              <div key={index} className="overflow-hidden rounded-xl bg-gray-light">
                {unit.image && (
                  <div className="relative aspect-[4/3]">
                    <CroppedImage
                      src={getImageUrl(unit.image)}
                      crop={unit.image.crop}
                      alt={getLocalizedText(unit.image.alt, lang) || name}
                      sizes="(max-width: 640px) 100vw, 33vw"
                    />
                  </div>
                )}
                <div className="p-6">
                  {spec && (
                    <span className="text-[11px] font-semibold uppercase tracking-[2px] text-gold">
                      {spec}
                    </span>
                  )}
                  {name && (
                    <h3
                      className={`font-primary text-[22px] italic leading-snug text-green-dark ${
                        spec ? 'mt-2' : ''
                      }`}
                    >
                      {name}
                    </h3>
                  )}
                  {desc && <p className="mt-3 text-[14px] leading-[1.8] text-gray-text">{desc}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
