"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import Footer from "@/components/Footer";
import HotelMap from "@/components/HotelMap";
import { apiClient } from "@/lib/api-client";
import { formatLocation, getImageUrl, type Hotel } from "@/types/hotel";

const partners = [
  "VIRTUOSO", "FOUR SEASONS", "ĀMAN", "PENINSULA",
  "PARK HYATT", "EDITION", "MANDARIN ORIENTAL", "ROSEWOOD"
];

// Helper function to derive tag from hotel data
function getHotelTag(hotel: Hotel): string {
  if (hotel.star_rating === "5") return "PALACE";
  if (hotel.star_rating) return `${hotel.star_rating} STAR`;
  return "LUXURY";
}

export default function DreamHotelsPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadHotels() {
      try {
        setIsLoading(true);
        const data = await apiClient.getHotels({ limit: 100, language: 'en' });
        setHotels(data);
      } catch (error) {
        console.error('Failed to load hotels:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadHotels();
  }, []);

  return (
    <main className="min-h-screen bg-gray-light">
      {/* Hero */}
      <section className="relative h-[720px] w-full overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1920&h=900&fit=crop"
          alt="Luxury hotel"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1E3D2F]/60 via-[#1E3D2F]/70 to-[#1E3D2F]/90" />

        {/* Nav */}
        <nav className="relative z-10 flex h-16 items-center justify-between px-[60px]">
          <Link href="/" className="font-primary text-[28px] font-bold text-white">
            TiP
          </Link>
          <div className="flex items-center gap-8">
            <Link href="/dream-hotels" className="text-[11px] font-semibold tracking-[2px] text-white">
              DREAM HOTELS
            </Link>
            <Link href="/more-dreams" className="text-[11px] font-medium tracking-[2px] text-white/70 hover:text-white">
              MORE DREAMS
            </Link>
            <Link href="/insights" className="text-[11px] font-medium tracking-[2px] text-white/70 hover:text-white">
              INSIGHTS
            </Link>
            <Link href="/my-page" className="text-[11px] font-medium tracking-[2px] text-white/70 hover:text-white">
              MY PAGE
            </Link>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 flex h-[calc(100%-64px)] flex-col items-center justify-center text-center">
          <span className="mb-4 text-[11px] font-semibold tracking-[4px] text-gold">
            CURATED COLLECTION
          </span>
          <h1 className="font-primary text-[64px] font-normal italic leading-tight text-white">
            Dream Hotels
          </h1>
          <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-white/60">
            Discover the world&apos;s most extraordinary hotels, hand-selected for
            unparalleled luxury and unforgettable experiences.
          </p>
        </div>
      </section>

      {/* Discovery / Map Section */}
      <section className="bg-white">
        {/* Interactive Map */}
        {isLoading ? (
          <div className="flex h-[520px] items-center justify-center bg-[#E8E4D8]">
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-green-dark border-t-transparent"></div>
              <p className="text-[16px] font-medium text-green-dark">Loading hotels...</p>
            </div>
          </div>
        ) : (
          <HotelMap hotels={hotels} />
        )}

        {/* Search filters */}
        <div className="px-20 py-10">
          <div className="flex items-center gap-4">
            <div className="flex-1 rounded-lg border border-gray-border bg-white px-5 py-4">
              <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">DESTINATION</p>
              <p className="text-[14px] font-medium text-green-dark">All destinations</p>
            </div>
            <div className="flex-1 rounded-lg border border-gray-border bg-white px-5 py-4">
              <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">HOTEL TYPE</p>
              <p className="text-[14px] font-medium text-green-dark">All types</p>
            </div>
            <div className="flex-1 rounded-lg border border-gray-border bg-white px-5 py-4">
              <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">PRICE RANGE</p>
              <p className="text-[14px] font-medium text-green-dark">Any price</p>
            </div>
            <button className="rounded-lg bg-green-dark px-8 py-4 text-[13px] font-semibold text-white">
              Search
            </button>
          </div>
        </div>
      </section>

      {/* Featured Hotels */}
      <section className="bg-gray-light px-20 py-20">
        <div className="mb-12 text-center">
          <span className="text-[11px] font-semibold tracking-[4px] text-gold">
            CURATED FOR YOU
          </span>
          <h2 className="mt-3 font-primary text-[42px] italic text-green-dark">
            Featured Hotels & Destinations
          </h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-green-dark border-t-transparent"></div>
          </div>
        ) : hotels.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-gray-text">No hotels available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-6">
            {hotels.map((hotel) => (
              <Link
                key={hotel.id}
                href={`/hotel/${hotel.id}`}
                className="group overflow-hidden rounded-xl bg-white shadow-sm transition-all hover:shadow-lg"
              >
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={getImageUrl(hotel.image?.[0])}
                    alt={hotel.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-semibold tracking-wider text-green-dark backdrop-blur-sm">
                    {getHotelTag(hotel)}
                  </div>
                  {hotel.review_summary && (
                    <div className="absolute right-3 top-3 rounded-full bg-green-dark px-2.5 py-1 text-[12px] font-semibold text-white">
                      {hotel.review_summary.average_rating.toFixed(1)}
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-primary text-[18px] font-semibold text-green-dark">
                    {hotel.name}
                  </h3>
                  <p className="mt-1 text-[13px] text-gray-text">{formatLocation(hotel)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Partners Section */}
      <section className="bg-green-dark px-[100px] py-20">
        <div className="text-center">
          <span className="text-[11px] font-semibold tracking-[4px] text-gold">
            TRUSTED PARTNERSHIPS
          </span>
          <h2 className="mt-3 font-primary text-[42px] italic text-[#FAF5EF]">
            Our Global Luxury Hotel Network
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[16px] leading-relaxed text-white/50">
            Book through TiP / Paris Class and enjoy preferred rates, exclusive privileges,
            and benefits you won&apos;t find elsewhere.
          </p>
        </div>

        <div className="mx-auto mt-12 flex flex-wrap items-center justify-center gap-x-16 gap-y-6">
          {partners.map((partner) => (
            <span
              key={partner}
              className="text-[14px] font-semibold tracking-[3px] text-white/30"
            >
              {partner}
            </span>
          ))}
        </div>

        <p className="mt-12 text-center text-[14px] leading-relaxed text-white/40">
          Reserve with us to unlock the maximum benefits, preferred access, and exclusive
          savings — at the same price or better.
        </p>
      </section>

      <Footer />
    </main>
  );
}
