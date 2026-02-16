"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import TopBar from "@/components/TopBar";
import Footer from "@/components/Footer";
import { apiClient } from "@/lib/api-client";
import { formatLocation, getImageUrl, type Hotel } from "@/types/hotel";

const benefits = [
  { icon: "✦", title: "Room Upgrade", description: "Complimentary upgrade to the next room category, subject to availability at check-in." },
  { icon: "◈", title: "Daily Breakfast", description: "Full breakfast for two guests daily at the hotel's signature restaurant." },
  { icon: "◇", title: "Hotel Credit", description: "$100 USD equivalent property credit to use during your stay on dining or spa." },
  { icon: "○", title: "Early Check-in & Late Checkout", description: "Check in as early as 12pm and check out as late as 4pm, subject to availability." },
];

// TODO: Replace with backend room details API once available
// Backend currently only provides room names in `available_rooms` array
// Hard-coded room details below include pricing, sizes, features
const HARDCODED_ROOMS = [
  {
    name: "Superior Room",
    size: "35 m²",
    price: "€850",
    perNight: "per night",
    image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=500&h=350&fit=crop",
    features: ["King Bed", "City View", "Marble Bathroom"],
  },
  {
    name: "Deluxe Suite",
    size: "55 m²",
    price: "€1,450",
    perNight: "per night",
    image: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=500&h=350&fit=crop",
    features: ["King Bed", "Garden View", "Separate Living Area"],
  },
  {
    name: "Royal Suite",
    size: "95 m²",
    price: "€3,200",
    perNight: "per night",
    image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=500&h=350&fit=crop",
    features: ["King Bed", "Panoramic View", "Butler Service"],
  },
];

export default function HotelDetailPage() {
  const params = useParams();
  const hotelId = params.id as string;

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadHotel() {
      try {
        setIsLoading(true);
        const hotelData = await apiClient.getHotelById(hotelId);
        setHotel(hotelData);
      } catch (err) {
        console.error('Failed to load hotel:', err);
        setError('Hotel not found');
      } finally {
        setIsLoading(false);
      }
    }

    if (hotelId) {
      loadHotel();
    }
  }, [hotelId]);

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
          <p className="mt-4 text-gray-text">The hotel you&apos;re looking for doesn&apos;t exist.</p>
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

  // Helper function to derive tagline from hotel data
  const getTagline = () => {
    if (hotel.star_rating === "5") return "PALACE HOTEL";
    if (hotel.star_rating) return `${hotel.star_rating} STAR HOTEL`;
    return "LUXURY HOTEL";
  };

  return (
    <main className="min-h-screen bg-background">
      <TopBar activeLink="Dream Hotels" />

      {/* Hero */}
      <section className="relative h-[560px] w-full overflow-hidden">
        <img
          src={getImageUrl(hotel.image?.[0])}
          alt={hotel.name}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="relative z-10 flex h-full flex-col justify-end px-20 pb-16">
          <span className="mb-3 inline-block w-fit rounded-full bg-gold/90 px-4 py-1.5 text-[11px] font-semibold tracking-[2px] text-white">
            {getTagline()}
          </span>
          <h1 className="font-primary text-[56px] font-normal italic leading-none text-white">
            {hotel.name}
          </h1>
          <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-white/70">
            {hotel.description}
          </p>
        </div>
      </section>

      {/* Why We Love It */}
      <section className="bg-white px-20 py-20">
        <div className="mx-auto flex max-w-7xl items-start gap-16">
          <div className="flex-1">
            <span className="text-[11px] font-semibold tracking-[4px] text-gold">
              WHY WE LOVE IT
            </span>
            <h2 className="mt-3 font-primary text-[38px] italic leading-snug text-green-dark">
              {formatLocation(hotel)}
            </h2>
            <p className="mt-5 text-[15px] leading-[1.8] text-gray-text">
              {hotel.name} is one of those rare hotels where everything feels both
              impossibly grand and genuinely warm. The staff remember your name,
              your preferences, and exactly how you take your morning café crème.
            </p>
            <p className="mt-4 text-[15px] leading-[1.8] text-gray-text">
              Every detail has been considered, from the impeccable service to the
              carefully curated art collection. This is hospitality at its finest,
              where tradition meets modern luxury.
            </p>
            <div className="mt-8 flex gap-12">
              {hotel.review_summary && (
                <div>
                  <p className="font-primary text-[32px] font-semibold text-green-dark">
                    {hotel.review_summary.average_rating.toFixed(1)}
                  </p>
                  <p className="text-[12px] text-gray-text">Guest Rating (out of 5)</p>
                </div>
              )}
              {hotel.star_rating && (
                <div>
                  <p className="font-primary text-[32px] font-semibold text-green-dark">
                    {hotel.star_rating}
                  </p>
                  <p className="text-[12px] text-gray-text">Star Rating</p>
                </div>
              )}
              {hotel.review_summary && (
                <div>
                  <p className="font-primary text-[32px] font-semibold text-green-dark">
                    {hotel.review_summary.total_reviews}
                  </p>
                  <p className="text-[12px] text-gray-text">Reviews</p>
                </div>
              )}
            </div>
          </div>
          <div className="w-[400px] overflow-hidden rounded-lg">
            <img
              src={getImageUrl(hotel.image?.[1] || hotel.image?.[0])}
              alt={`${hotel.name} interior`}
              className="h-[480px] w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* TiP Exclusive Benefits */}
      <section className="bg-green-dark px-20 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center">
            <span className="text-[11px] font-semibold tracking-[4px] text-gold">
              TiP EXCLUSIVE BENEFITS
            </span>
            <h2 className="mt-3 font-primary text-[36px] italic text-white">
              Your Privileges at {hotel.name}
            </h2>
            <p className="mt-2 text-[14px] text-white/50">
              As a TiP member, enjoy these complimentary benefits during your stay
            </p>
          </div>
          <div className="grid grid-cols-4 gap-5">
            {benefits.map((b) => (
              <div
                key={b.title}
                className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
              >
                <span className="text-2xl text-gold">{b.icon}</span>
                <h3 className="mt-4 text-[15px] font-semibold text-white">{b.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-white/50">
                  {b.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Select Your Room */}
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
          <div className="grid grid-cols-3 gap-6">
            {HARDCODED_ROOMS.map((room) => (
              <div
                key={room.name}
                className="group overflow-hidden rounded-xl bg-white shadow-sm transition-shadow hover:shadow-lg"
              >
                <div className="relative h-52 overflow-hidden">
                  <img
                    src={room.image}
                    alt={room.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-primary text-[20px] font-semibold text-green-dark">
                        {room.name}
                      </h3>
                      <p className="mt-1 text-[13px] text-gray-text">{room.size}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[18px] font-semibold text-green-dark">{room.price}</p>
                      <p className="text-[11px] text-gray-text">{room.perNight}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {room.features.map((f) => (
                      <span
                        key={f}
                        className="rounded-full bg-gray-light px-3 py-1 text-[11px] font-medium text-gray-text"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                  <button className="mt-5 w-full rounded-full bg-green-dark py-3 text-[13px] font-semibold text-white transition-opacity hover:opacity-90">
                    Select Room
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Experiences Section */}
      <section className="bg-gray-light px-20 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center">
            <span className="text-[11px] font-semibold tracking-[4px] text-gold">
              EXPLORE THE AREA
            </span>
            <h2 className="mt-3 font-primary text-[38px] italic text-green-dark">
              Experiences Nearby
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-8">
            {/* Map placeholder */}
            <div className="flex h-[500px] items-center justify-center overflow-hidden rounded-lg bg-[#E8E4D8]">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-dark/10">
                  <span className="text-lg text-green-dark">📍</span>
                </div>
                <p className="text-[14px] font-medium text-green-dark">{hotel.location}</p>
                <p className="mt-1 text-[12px] text-gray-text">Interactive map</p>
              </div>
            </div>
            {/* Experiences list */}
            <div className="rounded-lg bg-white p-6">
              <h3 className="mb-4 text-[16px] font-semibold text-green-dark">Nearby Attractions</h3>
              {[
                { name: "Local Museum", type: "Culture", distance: "1.2 km" },
                { name: "Shopping District", type: "Shopping", distance: "0.3 km" },
                { name: "Historic Landmark", type: "Landmark", distance: "1.0 km" },
                { name: "Fine Dining", type: "Restaurant", distance: "0.5 km" },
                { name: "Art Gallery", type: "Culture", distance: "0.8 km" },
              ].map((exp) => (
                <div
                  key={exp.name}
                  className="flex items-center justify-between border-b border-gray-100 py-4 last:border-0"
                >
                  <div>
                    <p className="text-[14px] font-medium text-green-dark">{exp.name}</p>
                    <p className="text-[12px] text-gray-text">{exp.type}</p>
                  </div>
                  <p className="text-[13px] font-medium text-green-dark">{exp.distance}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#3D3530] px-20 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-[11px] font-semibold tracking-[4px] text-white/50">
            READY TO BEGIN
          </span>
          <h2 className="mt-4 font-primary text-[52px] italic leading-tight text-[#FAF5EF]">
            Your Concierge Awaits
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-white/60">
            Have questions about your journey or wish to customize any aspect of your
            itinerary? Our dedicated travel specialists are available around the clock.
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
