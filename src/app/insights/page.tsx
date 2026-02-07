"use client";

import TopBar from "@/components/TopBar";
import Footer from "@/components/Footer";
import Image from "next/image";

const filters = ["All", "Destination Tips", "Hotel Reviews", "Cruise & Train", "Lifestyle"];

const articles = [
  {
    img: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&h=400&fit=crop",
    category: "Destination Tips",
    title: "Hidden Gems of the Amalfi Coast",
    excerpt: "Beyond Positano — discover the quiet villages and secret beaches that make southern Italy unforgettable.",
    readTime: "5 min read",
  },
  {
    img: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&h=400&fit=crop",
    category: "Hotel Reviews",
    title: "Inside Aman Tokyo: A Review",
    excerpt: "Minimalist luxury meets Japanese tradition in one of the most refined urban retreats.",
    readTime: "7 min read",
  },
  {
    img: "https://images.unsplash.com/photo-1548574505-5e239809ee19?w=600&h=400&fit=crop",
    category: "Cruise & Train",
    title: "Orient Express: Is It Worth the Hype?",
    excerpt: "We rode the legendary Venice Simplon route to find out if the romance lives up to the legend.",
    readTime: "6 min read",
  },
  {
    img: "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=600&h=400&fit=crop",
    category: "Lifestyle",
    title: "Packing Like a Luxury Traveler",
    excerpt: "A curated capsule wardrobe approach to traveling light without sacrificing style.",
    readTime: "4 min read",
  },
  {
    img: "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=600&h=400&fit=crop",
    category: "Destination Tips",
    title: "Maldives: Choosing the Right Atoll",
    excerpt: "Not all Maldivian islands are created equal. Here is how to pick the perfect one for your trip.",
    readTime: "5 min read",
  },
  {
    img: "https://images.unsplash.com/photo-1549294413-26f195200c16?w=600&h=400&fit=crop",
    category: "Hotel Reviews",
    title: "The New Raffles London Reviewed",
    excerpt: "Historic grandeur meets contemporary cool in this much-anticipated London opening.",
    readTime: "8 min read",
  },
];

export default function InsightsPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <TopBar activeLink="Insights" />

      {/* Hero */}
      <section className="px-16 pt-16 pb-12">
        <p className="font-inter text-xs tracking-[3px] uppercase text-[#1E3D2F]/50 mb-3">
          Luxury Travel Intelligence
        </p>
        <h1 className="font-cormorant text-[56px] leading-tight text-[#1E3D2F] max-w-2xl">
          Stories, Tips & Insider Knowledge
        </h1>
      </section>

      {/* Featured Article */}
      <section className="px-16 mb-16">
        <div className="relative w-full h-[480px] rounded-2xl overflow-hidden">
          <Image
            src="https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=1400&h=480&fit=crop"
            alt="Featured article"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 p-10">
            <span className="inline-block bg-white/20 backdrop-blur-sm text-white font-inter text-xs tracking-[2px] uppercase px-3 py-1 rounded-full mb-4">
              Featured
            </span>
            <h2 className="font-cormorant text-[40px] text-white leading-tight max-w-xl mb-2">
              The Future of Luxury Travel in 2026
            </h2>
            <p className="font-inter text-sm text-white/80 max-w-lg">
              From AI-powered concierges to sustainable ultra-luxury — the trends redefining how discerning travelers explore.
            </p>
          </div>
        </div>
      </section>

      {/* Filter Pills */}
      <section className="px-16 mb-10">
        <div className="flex gap-3">
          {filters.map((filter, i) => (
            <button
              key={filter}
              className={`px-5 py-2 rounded-full font-inter text-sm transition-colors ${
                i === 0
                  ? "bg-[#1E3D2F] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </section>

      {/* Article Grid */}
      <section className="px-16 mb-20">
        <div className="grid grid-cols-3 gap-8">
          {articles.map((article) => (
            <article key={article.title} className="group cursor-pointer">
              <div className="relative w-full h-[220px] rounded-xl overflow-hidden mb-4">
                <Image
                  src={article.img}
                  alt={article.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <span className="inline-block font-inter text-[10px] tracking-[2px] uppercase text-[#1E3D2F]/60 mb-2">
                {article.category}
              </span>
              <h3 className="font-cormorant text-xl text-[#1E3D2F] mb-2 group-hover:underline">
                {article.title}
              </h3>
              <p className="font-inter text-sm text-gray-500 mb-3 line-clamp-2">
                {article.excerpt}
              </p>
              <span className="font-inter text-xs text-gray-400">{article.readTime}</span>
            </article>
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-[#1E3D2F] py-20 px-16">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-cormorant text-[40px] text-white mb-3">The TiP Insider</h2>
          <p className="font-inter text-sm text-white/60 mb-8">
            Weekly curated luxury travel insights, delivered straight to your inbox.
          </p>
          <div className="flex gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Your email address"
              className="flex-1 bg-white/10 border border-white/20 rounded-lg px-5 py-3 font-inter text-sm text-white placeholder:text-white/40 outline-none focus:border-white/50"
            />
            <button className="bg-white text-[#1E3D2F] rounded-lg px-6 py-3 font-inter text-sm font-medium hover:bg-white/90 transition-colors">
              Subscribe
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
