'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Footer from '@/components/Footer';
import Image from 'next/image';
import EntityReviews from '@/components/reviews/EntityReviews';
import { apiClient } from '@/lib/api-client';
import { getImageUrl, getLocalizedText } from '@/types/common';
import type { Restaurant } from '@/types/restaurant';
import { useLanguage } from '@/contexts/LanguageContext';

export default function RestaurantDetailPage() {
  const { t, lang } = useLanguage();
  const params = useParams();
  const restaurantId = params.id as string;

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRestaurant() {
      try {
        setIsLoading(true);
        const data = await apiClient.getRestaurantBySlug(restaurantId, lang);
        setRestaurant(data);
      } catch (err) {
        console.error('Failed to load restaurant:', err);
        setError(t('detail.error_restaurant_not_found'));
      } finally {
        setIsLoading(false);
      }
    }

    if (restaurantId) {
      loadRestaurant();
    }
  }, [restaurantId, lang, t]);

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

  if (error || !restaurant) {
    return (
      <main className="min-h-screen bg-background">
        <div className="flex flex-col items-center justify-center py-40">
          <h1 className="font-primary text-[42px] italic text-green-dark">
            {t('detail.restaurant_not_found_title')}
          </h1>
          <p className="mt-4 text-gray-text">{t('detail.restaurant_not_found_body')}</p>
          <Link
            href="/more-dreams"
            className="mt-8 rounded-full bg-green-dark px-8 py-3 text-[13px] font-semibold text-white hover:bg-green-dark/90"
          >
            {t('detail.back_to_more_dreams')}
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  const primaryRecognition = restaurant.recognitions?.[0];
  const badge =
    primaryRecognition?.source_type === 'michelin' && primaryRecognition.tier
      ? primaryRecognition.tier.replaceAll('_', ' ').toUpperCase()
      : t('detail.restaurant_badge');

  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative h-[560px] w-full overflow-hidden">
        <Image
          src={getImageUrl(restaurant.images?.[0])}
          alt={getLocalizedText(restaurant.name)}
          className="absolute inset-0 object-cover"
          fill
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="relative z-10 flex h-full flex-col justify-end px-20 pb-16">
          <span className="mb-3 inline-block w-fit rounded-full bg-gold/90 px-4 py-1.5 text-[11px] font-semibold tracking-[2px] text-white">
            {badge}
          </span>
          <h1 className="font-primary text-[56px] font-normal italic leading-none text-white">
            {getLocalizedText(restaurant.name)}
          </h1>
          <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-white/70">
            {getLocalizedText(restaurant.description)}
          </p>
        </div>
      </section>

      {/* About */}
      <section className="bg-white px-20 py-20">
        <div className="mx-auto flex max-w-7xl items-start gap-16">
          <div className="flex-1">
            <span className="text-[11px] font-semibold tracking-[4px] text-gold">
              {t('detail.about_restaurant')}
            </span>
            <h2 className="mt-3 font-primary text-[38px] italic leading-snug text-green-dark">
              {getLocalizedText(restaurant.name)}
            </h2>
            <p className="mt-5 text-[15px] leading-[1.8] text-gray-text">
              {getLocalizedText(restaurant.description)}
            </p>
            {primaryRecognition && (
              <div className="mt-8">
                <p className="font-primary text-[32px] font-semibold text-green-dark">
                  {primaryRecognition.tier?.replaceAll('_', ' ') || primaryRecognition.source_type}
                </p>
                <p className="text-[12px] text-gray-text">{t('detail.recognition')}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Practical Info */}
      <section className="bg-gray-light px-20 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center">
            <span className="text-[11px] font-semibold tracking-[4px] text-gold">
              {t('detail.plan_your_visit')}
            </span>
            <h2 className="mt-3 font-primary text-[38px] italic text-green-dark">
              {t('detail.practical_information')}
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-6">
            {restaurant.address && (
              <div className="rounded-xl bg-white p-8 shadow-sm">
                <span className="text-[11px] font-semibold tracking-[2px] text-gold">
                  {t('detail.address')}
                </span>
                <p className="mt-3 text-[15px] leading-relaxed text-green-dark">
                  {getLocalizedText(restaurant.address)}
                </p>
              </div>
            )}
            {restaurant.opening_hours && (
              <div className="rounded-xl bg-white p-8 shadow-sm">
                <span className="text-[11px] font-semibold tracking-[2px] text-gold">
                  {t('detail.opening_hours')}
                </span>
                <p className="mt-3 text-[15px] leading-relaxed text-green-dark">
                  {getLocalizedText(restaurant.opening_hours)}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="bg-white px-20 py-20">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 text-center">
            <span className="text-[11px] font-semibold tracking-[4px] text-gold">
              {t('detail.guest_reviews')}
            </span>
            <h2 className="mt-3 font-primary text-[38px] italic text-green-dark">
              {t('detail.what_travelers_say')}
            </h2>
          </div>
          <EntityReviews entityType="restaurant" entityId={restaurant.id} />
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#3D3530] px-20 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-[11px] font-semibold tracking-[4px] text-white/50">
            {t('detail.ready_to_dine')}
          </span>
          <h2 className="mt-4 font-primary text-[52px] italic leading-tight text-[#FAF5EF]">
            {t('detail.concierge_awaits')}
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-white/60">
            {t('detail.cta_restaurant_body2')}
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              href="/concierge"
              className="rounded-full bg-white px-8 py-4 text-[13px] font-semibold text-green-dark transition-opacity hover:opacity-90"
            >
              {t('detail.chat_with_concierge')}
            </Link>
            <Link
              href="/more-dreams"
              className="rounded-full border border-white/30 px-8 py-4 text-[13px] font-semibold text-white transition-colors hover:bg-white/10"
            >
              {t('detail.back_to_more_dreams')}
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
