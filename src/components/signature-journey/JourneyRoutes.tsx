'use client';

import CroppedImage from '@/components/hotel/CroppedImage';
import JourneySectionHeader from '@/components/signature-journey/JourneySectionHeader';
import { getImageUrl, getLocalizedText } from '@/types/common';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Route } from '@/types/signatureJourney';

interface JourneyRoutesProps {
  routes: Route[];
}

export default function JourneyRoutes({ routes }: JourneyRoutesProps) {
  const { t, lang } = useLanguage();
  const items = routes.filter(
    (route) =>
      route.map_image ||
      getLocalizedText(route.region, lang) ||
      getLocalizedText(route.title, lang) ||
      getLocalizedText(route.stops, lang) ||
      getLocalizedText(route.meta, lang),
  );
  if (items.length === 0) return null;

  return (
    <section className="bg-gray-light px-4 py-14 md:px-10 md:py-20" data-testid="journey-routes">
      <div className="mx-auto max-w-7xl">
        <JourneySectionHeader
          overline={t('signature_journey_detail.routes_overline')}
          title={t('signature_journey_detail.routes_title')}
        />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {items.map((route, index) => {
            const region = getLocalizedText(route.region, lang);
            const title = getLocalizedText(route.title, lang);
            const stops = getLocalizedText(route.stops, lang);
            const meta = getLocalizedText(route.meta, lang);
            return (
              <div key={index} className="overflow-hidden rounded-xl bg-white shadow-sm">
                {route.map_image && (
                  <div className="relative aspect-[16/9]">
                    <CroppedImage
                      src={getImageUrl(route.map_image)}
                      crop={route.map_image.crop}
                      alt={getLocalizedText(route.map_image.alt, lang) || title}
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                  </div>
                )}
                <div className="p-8">
                  {region && (
                    <span className="text-[11px] font-semibold uppercase tracking-[2px] text-gold">
                      {region}
                    </span>
                  )}
                  {title && (
                    <h3
                      className={`font-primary text-[24px] italic leading-snug text-green-dark ${
                        region ? 'mt-2' : ''
                      }`}
                    >
                      {title}
                    </h3>
                  )}
                  {stops && (
                    <p className="mt-4 whitespace-pre-line text-[14px] leading-[1.8] text-gray-text">
                      {stops}
                    </p>
                  )}
                  {meta && <p className="mt-4 text-[12px] text-gray-text/80">{meta}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
