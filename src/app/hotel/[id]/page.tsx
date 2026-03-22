'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import TopBar from '@/components/TopBar';
import Footer from '@/components/Footer';
import { apiClient } from '@/lib/api-client';
import { getLocalizedText } from '@/types/common';
import { getHotelExternalLink, getHotelImages, type Hotel } from '@/types/hotel';

function getTagline(hotel: Hotel): string {
  if (hotel.star_rating === '5') return 'PALACE HOTEL';
  if (hotel.star_rating) return `${hotel.star_rating} STAR HOTEL`;
  return 'LUXURY HOTEL';
}

function getPolicyLabel(policyType: string): string {
  switch (policyType) {
    case 'pet':
      return 'Pet Policy';
    case 'smoking':
      return 'Smoking Policy';
    case 'child':
      return 'Children';
    case 'lounge_child':
      return 'Lounge Access';
    default:
      return 'Policy';
  }
}

export default function HotelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.id as string;

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadHotel() {
      try {
        setIsLoading(true);
        setError(null);
        const hotelData = await apiClient.getHotelBySlug(slug);
        setHotel(hotelData);
      } catch (err) {
        console.error('Failed to load hotel:', err);
        setError('Hotel not found');
      } finally {
        setIsLoading(false);
      }
    }

    if (slug) {
      loadHotel();
    }
  }, [slug]);

  const hotelImages = useMemo(
    () => (hotel ? getHotelImages(hotel) : ['/placeholder.jpg']),
    [hotel],
  );
  const googleMapUrl = hotel ? getHotelExternalLink(hotel, 'google_map') : null;
  const officialWebsiteUrl = hotel ? getHotelExternalLink(hotel, 'official_website') : null;

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background">
        <TopBar activeLink="Dream Hotels" />
        <div className="flex items-center justify-center py-40">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-green-dark border-t-transparent"></div>
        </div>
        <Footer />
      </main>
    );
  }

  if (error || !hotel) {
    return (
      <main className="min-h-screen bg-background">
        <TopBar activeLink="Dream Hotels" />
        <div className="flex flex-col items-center justify-center py-40">
          <h1 className="font-primary text-[42px] italic text-green-dark">Hotel Not Found</h1>
          <p className="mt-4 text-gray-text">
            The hotel you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link
            href="/dream-hotels"
            className="mt-8 rounded-full bg-green-dark px-8 py-3 text-[13px] font-semibold text-white hover:bg-green-dark/90"
          >
            Back to Hotels
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  const benefits = hotel.benefits ?? [];
  const rooms = hotel.rooms ?? [];
  const features = hotel.features ?? [];
  const faqs = hotel.faqs ?? [];
  const policies = hotel.policies ?? [];
  const highlights = hotel.highlights ?? [];

  return (
    <main className="min-h-screen bg-background">
      <TopBar activeLink="Dream Hotels" />

      <section className="relative h-[560px] w-full overflow-hidden">
        <Image
          src={hotelImages[0]}
          alt={getLocalizedText(hotel.name)}
          fill
          sizes="100vw"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="relative z-10 flex h-full flex-col justify-end px-20 pb-16">
          <span className="mb-3 inline-block w-fit rounded-full bg-gold/90 px-4 py-1.5 text-[11px] font-semibold tracking-[2px] text-white">
            {getTagline(hotel)}
          </span>
          <h1 className="font-primary text-[56px] font-normal italic leading-none text-white">
            {getLocalizedText(hotel.name)}
          </h1>
          <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-white/70">
            {getLocalizedText(hotel.overview)}
          </p>
        </div>
      </section>

      <section className="bg-white px-20 py-20">
        <div className="mx-auto flex max-w-7xl items-start gap-16">
          <div className="flex-1">
            <span className="text-[11px] font-semibold tracking-[4px] text-gold">
              WHY WE LOVE IT
            </span>
            <h2 className="mt-3 font-primary text-[38px] italic leading-snug text-green-dark">
              {getLocalizedText(hotel.address)}
            </h2>
            <p className="mt-5 text-[15px] leading-[1.8] text-gray-text">
              {getLocalizedText(hotel.overview)}
            </p>

            {highlights.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-3">
                {highlights.map((highlight, index) => (
                  <div
                    key={`${highlight.highlight_type}-${index}`}
                    className="rounded-full bg-gray-light px-4 py-2 text-[12px] font-medium text-green-dark"
                  >
                    {highlight.highlight_type === 'tag'
                      ? getLocalizedText(highlight.text)
                      : `${getLocalizedText(highlight.label)}: ${getLocalizedText(highlight.value)}`}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8 flex flex-wrap gap-8">
              {hotel.star_rating && (
                <div>
                  <p className="font-primary text-[32px] font-semibold text-green-dark">
                    {hotel.star_rating}
                  </p>
                  <p className="text-[12px] text-gray-text">Star Rating</p>
                </div>
              )}
              {hotel.check_in_time && (
                <div>
                  <p className="font-primary text-[32px] font-semibold text-green-dark">
                    {hotel.check_in_time}
                  </p>
                  <p className="text-[12px] text-gray-text">Check-in</p>
                </div>
              )}
              {hotel.check_out_time && (
                <div>
                  <p className="font-primary text-[32px] font-semibold text-green-dark">
                    {hotel.check_out_time}
                  </p>
                  <p className="text-[12px] text-gray-text">Check-out</p>
                </div>
              )}
            </div>

            {(officialWebsiteUrl || googleMapUrl) && (
              <div className="mt-8 flex gap-3">
                {officialWebsiteUrl && (
                  <a
                    href={officialWebsiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-green-dark px-5 py-3 text-[13px] font-semibold text-white hover:bg-green-dark/90"
                  >
                    Visit Website
                  </a>
                )}
                {googleMapUrl && (
                  <a
                    href={googleMapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-green-dark px-5 py-3 text-[13px] font-semibold text-green-dark hover:bg-green-dark hover:text-white"
                  >
                    View Map
                  </a>
                )}
              </div>
            )}
          </div>
          <div className="w-[400px] overflow-hidden rounded-lg">
            <Image
              src={hotelImages[1] || hotelImages[0]}
              alt={`${getLocalizedText(hotel.name)} interior`}
              width={400}
              height={480}
              className="h-[480px] w-full object-cover"
            />
          </div>
        </div>
      </section>

      <section className="bg-green-dark px-20 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center">
            <span className="text-[11px] font-semibold tracking-[4px] text-gold">
              TiP EXCLUSIVE BENEFITS
            </span>
            <h2 className="mt-3 font-primary text-[36px] italic text-white">
              Your Privileges at {getLocalizedText(hotel.name)}
            </h2>
          </div>
          {benefits.length === 0 ? (
            <p className="text-center text-[14px] text-white/60">
              Benefit details will be available soon.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-5">
              {benefits.map((program, index) => (
                <div
                  key={`${program.program_name || 'program'}-${index}`}
                  className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
                >
                  <p className="text-[12px] font-semibold tracking-[2px] text-gold">
                    {program.program_name || 'Member Benefit'}
                  </p>
                  {program.membership_tier && (
                    <p className="mt-2 text-[11px] uppercase tracking-[2px] text-white/50">
                      {program.membership_tier}
                    </p>
                  )}
                  <ul className="mt-4 space-y-2">
                    {program.benefits.map((benefit, benefitIndex) => (
                      <li key={benefitIndex} className="text-[13px] leading-relaxed text-white/80">
                        {getLocalizedText(benefit)}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-white px-20 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center">
            <span className="text-[11px] font-semibold tracking-[4px] text-green-dark">
              ACCOMMODATIONS
            </span>
            <h2 className="mt-3 font-primary text-[42px] italic text-[#3D3D3D]">
              Select Your Room
            </h2>
          </div>
          {rooms.length === 0 ? (
            <p className="text-center text-[14px] text-gray-text">
              Room details will be added soon.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-6">
              {rooms.map((room, index) => (
                <div
                  key={`${getLocalizedText(room.name)}-${index}`}
                  className="group overflow-hidden rounded-xl bg-white shadow-sm transition-shadow hover:shadow-lg"
                >
                  <div className="relative h-52 overflow-hidden">
                    <Image
                      src={
                        room.images?.[0]
                          ? getHotelImages({ ...hotel, images: room.images })[0]
                          : hotelImages[0]
                      }
                      alt={getLocalizedText(room.name)}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-primary text-[20px] font-semibold text-green-dark">
                          {getLocalizedText(room.name)}
                        </h3>
                        {room.size_sqm && (
                          <p className="mt-1 text-[13px] text-gray-text">{room.size_sqm} m²</p>
                        )}
                      </div>
                    </div>
                    {room.summary && (
                      <p className="mt-4 text-[13px] leading-relaxed text-gray-text">
                        {getLocalizedText(room.summary)}
                      </p>
                    )}
                    <button className="mt-5 w-full rounded-full bg-green-dark py-3 text-[13px] font-semibold text-white transition-opacity hover:opacity-90">
                      Ask Concierge
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-gray-light px-20 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 gap-8">
            <div className="rounded-lg bg-white p-8">
              <h3 className="font-primary text-[30px] italic text-green-dark">Features</h3>
              <div className="mt-6 flex flex-wrap gap-3">
                {features.length === 0 ? (
                  <p className="text-[14px] text-gray-text">Feature details will be added soon.</p>
                ) : (
                  features.map((feature, index) => (
                    <span
                      key={`${feature.feature_type}-${index}`}
                      className="rounded-full bg-gray-light px-4 py-2 text-[12px] font-medium text-green-dark"
                    >
                      {getLocalizedText(feature.name)}
                    </span>
                  ))
                )}
              </div>
            </div>
            <div className="rounded-lg bg-white p-8">
              <h3 className="font-primary text-[30px] italic text-green-dark">Policies</h3>
              {policies.length === 0 ? (
                <p className="mt-6 text-[14px] text-gray-text">Policies will be added soon.</p>
              ) : (
                <div className="mt-6 space-y-4">
                  {policies.map((policy, index) => (
                    <div key={`${policy.policy_type}-${index}`}>
                      <p className="text-[12px] font-semibold tracking-[2px] text-gold">
                        {getPolicyLabel(policy.policy_type)}
                      </p>
                      <p className="mt-1 text-[14px] leading-relaxed text-gray-text">
                        {getLocalizedText(policy.content)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {faqs.length > 0 && (
        <section className="bg-white px-20 py-20">
          <div className="mx-auto max-w-4xl">
            <div className="mb-10 text-center">
              <span className="text-[11px] font-semibold tracking-[4px] text-gold">FAQ</span>
              <h2 className="mt-3 font-primary text-[38px] italic text-green-dark">
                Helpful Details
              </h2>
            </div>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="rounded-xl border border-gray-100 bg-gray-light p-6">
                  <h3 className="text-[16px] font-semibold text-green-dark">
                    {getLocalizedText(faq.question)}
                  </h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-gray-text">
                    {getLocalizedText(faq.answer)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="bg-[#3D3530] px-20 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-[11px] font-semibold tracking-[4px] text-white/50">
            READY TO BEGIN
          </span>
          <h2 className="mt-4 font-primary text-[52px] italic leading-tight text-[#FAF5EF]">
            Your Concierge Awaits
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-white/60">
            Have questions about your stay or want to tailor every detail? Our concierge team is
            here to help shape the trip around you.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              href="/concierge"
              className="rounded-full bg-white px-8 py-4 text-[13px] font-semibold text-green-dark transition-opacity hover:opacity-90"
            >
              Chat with Concierge
            </Link>
            <button
              onClick={() => router.back()}
              className="rounded-full border border-white/30 px-8 py-4 text-[13px] font-semibold text-white transition-colors hover:bg-white/10"
            >
              Back to Hotels
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
