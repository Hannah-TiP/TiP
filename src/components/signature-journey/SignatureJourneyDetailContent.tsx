'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Footer from '@/components/Footer';
import CroppedImage from '@/components/hotel/CroppedImage';
import FaqAccordion from '@/components/hotel/FaqAccordion';
import JourneySectionHeader from '@/components/signature-journey/JourneySectionHeader';
import JourneyHighlights from '@/components/signature-journey/JourneyHighlights';
import JourneyUnits from '@/components/signature-journey/JourneyUnits';
import JourneyRoutes from '@/components/signature-journey/JourneyRoutes';
import JourneySpecs from '@/components/signature-journey/JourneySpecs';
import JourneyInclusions from '@/components/signature-journey/JourneyInclusions';
import JourneyBenefits from '@/components/signature-journey/JourneyBenefits';
import { apiClient } from '@/lib/api-client';
import { getImageUrl, getLocalizedText } from '@/types/common';
import { toFaqItems, type SignatureJourney } from '@/types/signatureJourney';
import { useLanguage } from '@/contexts/LanguageContext';

interface SignatureJourneyDetailContentProps {
  slug: string;
}

export default function SignatureJourneyDetailContent({
  slug,
}: SignatureJourneyDetailContentProps) {
  const { t, lang } = useLanguage();

  const [journey, setJourney] = useState<SignatureJourney | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    async function loadJourney() {
      try {
        setIsLoading(true);
        setHasError(false);
        const data = await apiClient.getSignatureJourneyBySlug(slug, lang);
        setJourney(data);
      } catch (err) {
        console.error('Failed to load signature journey:', err);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    }

    if (slug) {
      loadJourney();
    }
  }, [slug, lang]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="flex items-center justify-center py-40">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-green-dark border-t-transparent"></div>
        </div>
        <Footer />
      </main>
    );
  }

  if (hasError || !journey) {
    return (
      <main className="min-h-screen bg-background">
        <div className="flex flex-col items-center justify-center px-4 py-40 text-center">
          <h1 className="font-primary text-[42px] italic text-green-dark">
            {t('signature_journey_detail.not_found_title')}
          </h1>
          <p className="mt-4 text-gray-text">{t('signature_journey_detail.not_found_body')}</p>
          <Link
            href="/signature-journeys"
            className="mt-8 rounded-full bg-green-dark px-8 py-3 text-[13px] font-semibold text-white hover:bg-green-dark/90"
          >
            {t('signature_journey_detail.back_to_journeys')}
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  const title = getLocalizedText(journey.title) || journey.slug;
  const description = getLocalizedText(journey.description);
  const lead = getLocalizedText(journey.lead);
  const body = getLocalizedText(journey.body);
  const gallery = (journey.gallery ?? []).slice(0, 3);
  const hasAbout = !!lead || !!body || gallery.length > 0;
  const faqItems = toFaqItems(journey.faqs);

  return (
    <main className="min-h-screen bg-background">
      {/* Hero — 16:9 hero_image with title + description overlay */}
      <section
        className="relative aspect-video max-h-[70vh] min-h-[360px] w-full overflow-hidden"
        data-testid="journey-hero"
      >
        <CroppedImage
          src={getImageUrl(journey.hero_image)}
          crop={journey.hero_image?.crop}
          alt={getLocalizedText(journey.hero_image?.alt) || title}
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute inset-0 z-10 flex flex-col justify-end px-4 pb-10 md:px-10 md:pb-16">
          <div className="mx-auto w-full max-w-7xl">
            <span className="mb-3 inline-block w-fit rounded-full bg-gold/90 px-4 py-1.5 text-[11px] font-semibold tracking-[2px] text-white">
              {t('signature_journeys.card_pill')}
            </span>
            <h1 className="font-primary text-[36px] font-normal italic leading-tight text-white md:text-[56px]">
              {title}
            </h1>
            {description && (
              <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-white/70 md:text-[16px]">
                {description}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* About — lead + body + gallery */}
      {hasAbout && (
        <section className="bg-white px-4 py-14 md:px-10 md:py-20" data-testid="journey-about">
          <div className="mx-auto max-w-4xl">
            <span className="block text-center text-[11px] font-semibold tracking-[4px] text-gold">
              {t('signature_journey_detail.about_overline')}
            </span>
            {lead && (
              <p className="mt-5 text-center font-primary text-[26px] italic leading-snug text-green-dark md:text-[32px]">
                {lead}
              </p>
            )}
            {body && (
              <p className="mt-6 whitespace-pre-line text-[15px] leading-[1.85] text-gray-text">
                {body}
              </p>
            )}
            {gallery.length > 0 && (
              <div
                className={`mt-10 grid gap-4 ${
                  gallery.length === 1 ? 'grid-cols-1' : 'grid-cols-2 md:grid-cols-3'
                }`}
              >
                {gallery.map((image, index) => (
                  <div key={index} className="relative aspect-[4/3] overflow-hidden rounded-xl">
                    <CroppedImage
                      src={getImageUrl(image)}
                      crop={image.crop}
                      alt={getLocalizedText(image.alt) || title}
                      sizes="(max-width: 768px) 50vw, 33vw"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Signature Highlights */}
      {journey.highlights && journey.highlights.length > 0 && (
        <JourneyHighlights highlights={journey.highlights} />
      )}

      {/* Units — suites / aircraft / options */}
      {journey.units && journey.units.length > 0 && <JourneyUnits units={journey.units} />}

      {/* Sample Routes */}
      {journey.routes && journey.routes.length > 0 && <JourneyRoutes routes={journey.routes} />}

      {/* Specs — at a glance */}
      {journey.specs && journey.specs.length > 0 && <JourneySpecs specs={journey.specs} />}

      {/* Inclusions */}
      {journey.inclusions && journey.inclusions.length > 0 && (
        <JourneyInclusions inclusions={journey.inclusions} />
      )}

      {/* Booking Benefits — inline per journey */}
      {journey.benefits && journey.benefits.length > 0 && (
        <JourneyBenefits benefits={journey.benefits} />
      )}

      {/* FAQ */}
      {faqItems.length > 0 && (
        <section className="bg-gray-light px-4 py-14 md:px-10 md:py-20" data-testid="journey-faq">
          <div className="mx-auto max-w-3xl">
            <JourneySectionHeader
              overline={t('signature_journey_detail.faq_overline')}
              title={t('signature_journey_detail.faq_title')}
            />
            <div className="rounded-xl bg-white p-6 md:p-8">
              <FaqAccordion faqs={faqItems} />
            </div>
          </div>
        </section>
      )}

      {/* Traveler Reviews intentionally omitted: the v2 reviews backend only
          supports hotel/restaurant/activity entity types — signature journeys
          live in their own table with their own id namespace, so no correct
          entity wiring exists yet (see SMA-209 summary). */}

      {/* Concierge CTA */}
      <section className="bg-green-dark px-4 py-16 md:px-10 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-[11px] font-semibold tracking-[4px] text-white/50">
            {t('detail.ready_to_explore')}
          </span>
          <h2 className="mt-4 font-primary text-[36px] italic leading-tight text-[#FAF5EF] md:text-[52px]">
            {t('detail.concierge_awaits')}
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-white/60">
            {t('signature_journey_detail.cta_body')}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/concierge"
              className="rounded-full bg-white px-8 py-4 text-[13px] font-semibold text-green-dark transition-opacity hover:opacity-90"
            >
              {t('detail.chat_with_concierge')}
            </Link>
            <Link
              href="/signature-journeys"
              className="rounded-full border border-white/30 px-8 py-4 text-[13px] font-semibold text-white transition-colors hover:bg-white/10"
            >
              {t('signature_journey_detail.back_to_journeys')}
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
