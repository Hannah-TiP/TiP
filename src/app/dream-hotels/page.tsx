"use client";

import Link from "next/link";
import TopBar from "@/components/TopBar";
import Footer from "@/components/Footer";

const featuredHotels = [
  { id: "le-bristol-paris", name: "Le Bristol Paris", location: "Paris, France", rating: 9.6, image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&h=400&fit=crop", tag: "Palace" },
  { id: "aman-tokyo", name: "Aman Tokyo", location: "Tokyo, Japan", rating: 9.5, image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600&h=400&fit=crop", tag: "Urban Sanctuary" },
  { id: "claridges", name: "Claridge's", location: "London, UK", rating: 9.4, image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop", tag: "Heritage" },
  { id: "the-peninsula", name: "The Peninsula", location: "Hong Kong", rating: 9.3, image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&h=400&fit=crop", tag: "Grand Dame" },
];

const moreHotels = [
  { id: "park-hyatt-sydney", name: "Park Hyatt Sydney", location: "Sydney, Australia", rating: 9.2, image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&h=400&fit=crop", tag: "Waterfront" },
  { id: "four-seasons-bora-bora", name: "Four Seasons Bora Bora", location: "French Polynesia", rating: 9.7, image: "https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=600&h=400&fit=crop", tag: "Island Paradise" },
  { id: "mandarin-oriental-bangkok", name: "Mandarin Oriental Bangkok", location: "Bangkok, Thailand", rating: 9.4, image: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=600&h=400&fit=crop", tag: "Riverside" },
  { id: "ritz-paris", name: "Ritz Paris", location: "Paris, France", rating: 9.5, image: "https://images.unsplash.com/photo-1455587734955-081b22074882?w=600&h=400&fit=crop", tag: "Legendary" },
];

const partners = [
  "VIRTUOSO", "FOUR SEASONS", "ĀMAN", "PENINSULA",
  "PARK HYATT", "EDITION", "MANDARIN ORIENTAL", "ROSEWOOD"
];

export default function DreamHotelsPage() {
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
        {/* Map placeholder */}
        <div className="flex h-[520px] items-center justify-center bg-[#E8E4D8]">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-dark/10">
              <span className="text-2xl">🗺️</span>
            </div>
            <p className="text-[16px] font-medium text-green-dark">Explore Hotels Worldwide</p>
            <p className="mt-1 text-[13px] text-gray-text">Interactive map with 200+ curated properties</p>
          </div>
        </div>

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
        <div className="grid grid-cols-4 gap-6">
          {featuredHotels.map((hotel) => (
            <Link
              key={hotel.id}
              href={`/hotel/${hotel.id}`}
              className="group overflow-hidden rounded-xl bg-white shadow-sm transition-all hover:shadow-lg"
            >
              <div className="relative h-56 overflow-hidden">
                <img
                  src={hotel.image}
                  alt={hotel.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-semibold tracking-wider text-green-dark backdrop-blur-sm">
                  {hotel.tag.toUpperCase()}
                </div>
                <div className="absolute right-3 top-3 rounded-full bg-green-dark px-2.5 py-1 text-[12px] font-semibold text-white">
                  {hotel.rating}
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-primary text-[18px] font-semibold text-green-dark">
                  {hotel.name}
                </h3>
                <p className="mt-1 text-[13px] text-gray-text">{hotel.location}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* More hotels */}
        <div className="mt-6 grid grid-cols-4 gap-6">
          {moreHotels.map((hotel) => (
            <Link
              key={hotel.id}
              href={`/hotel/${hotel.id}`}
              className="group overflow-hidden rounded-xl bg-white shadow-sm transition-all hover:shadow-lg"
            >
              <div className="relative h-56 overflow-hidden">
                <img
                  src={hotel.image}
                  alt={hotel.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-semibold tracking-wider text-green-dark backdrop-blur-sm">
                  {hotel.tag.toUpperCase()}
                </div>
                <div className="absolute right-3 top-3 rounded-full bg-green-dark px-2.5 py-1 text-[12px] font-semibold text-white">
                  {hotel.rating}
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-primary text-[18px] font-semibold text-green-dark">
                  {hotel.name}
                </h3>
                <p className="mt-1 text-[13px] text-gray-text">{hotel.location}</p>
              </div>
            </Link>
          ))}
        </div>
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
