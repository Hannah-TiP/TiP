"use client";

import TopBar from "@/components/TopBar";
import Footer from "@/components/Footer";
import Image from "next/image";

const cruises = [
  {
    name: "Crystal Esprit",
    img: "https://images.unsplash.com/photo-1548574505-5e239809ee19?w=600&h=400&fit=crop",
    desc: "An intimate 62-guest yacht exploring the Adriatic and Caribbean with butler service and open-bar luxury.",
  },
  {
    name: "Regent Seven Seas",
    img: "https://images.unsplash.com/photo-1599640842225-85d111c60e6b?w=600&h=400&fit=crop",
    desc: "All-inclusive ultra-luxury with the most spacious suites at sea and world-class dining.",
  },
  {
    name: "Silversea Voyages",
    img: "https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=600&h=400&fit=crop",
    desc: "Expedition meets elegance — from Antarctica to the Galápagos in boutique comfort.",
  },
];

const trains = [
  {
    name: "Venice Simplon Orient Express",
    img: "https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=600&h=400&fit=crop",
    desc: "Art deco grandeur on the iconic London-to-Venice route through the Alps.",
  },
  {
    name: "Maharajas' Express",
    img: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=600&h=400&fit=crop",
    desc: "India's most luxurious train — palatial suites, royal dining, and curated excursions.",
  },
  {
    name: "Rocky Mountaineer",
    img: "https://images.unsplash.com/photo-1504233529578-6d46baba6d34?w=600&h=400&fit=crop",
    desc: "Glass-domed coaches through the Canadian Rockies with gourmet cuisine and breathtaking panoramas.",
  },
];

export default function MoreDreamsPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <TopBar activeLink="More Dreams" />

      {/* Hero */}
      <section className="relative w-full h-[520px]">
        <Image
          src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&h=520&fit=crop"
          alt="More Dreams hero"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 px-16 pb-16">
          <span className="font-inter text-xs tracking-[3px] uppercase text-white/60 mb-3 block">
            MORE DREAMS
          </span>
          <h1 className="font-cormorant text-[56px] text-white leading-tight max-w-2xl">
            Beyond Hotels — Extraordinary Journeys
          </h1>
        </div>
      </section>

      {/* Cruise Section */}
      <section className="px-16 py-20">
        <h2 className="font-cormorant text-[40px] text-[#1E3D2F] mb-3">
          Sail the World in Unmatched Elegance
        </h2>
        <p className="font-inter text-sm text-gray-500 mb-10 max-w-xl">
          Curated voyages aboard the finest vessels on earth.
        </p>
        <div className="grid grid-cols-3 gap-8">
          {cruises.map((item) => (
            <div key={item.name} className="group cursor-pointer">
              <div className="relative w-full h-[280px] rounded-xl overflow-hidden mb-5">
                <Image
                  src={item.img}
                  alt={item.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <h3 className="font-cormorant text-2xl text-[#1E3D2F] mb-2">{item.name}</h3>
              <p className="font-inter text-sm text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Train Section */}
      <section className="px-16 py-20 bg-[#FAFAF8]">
        <h2 className="font-cormorant text-[40px] text-[#1E3D2F] mb-3">
          Legendary Routes, Timeless Elegance
        </h2>
        <p className="font-inter text-sm text-gray-500 mb-10 max-w-xl">
          Iconic rail journeys that redefine the art of slow travel.
        </p>
        <div className="grid grid-cols-3 gap-8">
          {trains.map((item) => (
            <div key={item.name} className="group cursor-pointer">
              <div className="relative w-full h-[280px] rounded-xl overflow-hidden mb-5">
                <Image
                  src={item.img}
                  alt={item.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <h3 className="font-cormorant text-2xl text-[#1E3D2F] mb-2">{item.name}</h3>
              <p className="font-inter text-sm text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#1E3D2F] py-20 px-16">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-cormorant text-[40px] text-white mb-4">
            Let TiP Curate Your Perfect Voyage
          </h2>
          <p className="font-inter text-sm text-white/60 mb-8">
            From ocean liners to luxury rail — tell us your dream and we&apos;ll craft the journey.
          </p>
          <button className="bg-white text-[#1E3D2F] rounded-lg px-8 py-4 font-inter text-sm font-medium hover:bg-white/90 transition-colors">
            Start Planning
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
