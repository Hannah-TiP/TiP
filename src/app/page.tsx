"use client";

import { useState } from "react";
import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import SubscribePopup from "@/components/SubscribePopup";
import { useAuth } from "@/contexts/AuthContext";

const mainNavLinks = [
  { label: "DREAM HOTELS", href: "/dream-hotels" },
  { label: "MORE DREAMS", href: "/more-dreams" },
  { label: "INSIGHTS", href: "/insights" },
];

const featuredHotels = [
  { id: 1, name: "Le Bristol Paris", location: "Paris, France", rating: 9.6, image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&h=400&fit=crop" },
  { id: 2, name: "Aman Tokyo", location: "Tokyo, Japan", rating: 9.5, image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600&h=400&fit=crop" },
  { id: 3, name: "Claridge's", location: "London, UK", rating: 9.4, image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop" },
  { id: 4, name: "The Peninsula", location: "Hong Kong", rating: 9.3, image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&h=400&fit=crop" },
];

const elevateCards = [
  {
    title: "AI Concierge",
    description: "Your personal travel assistant, available 24/7 to craft the perfect journey.",
    icon: "✨",
    link: "/concierge",
  },
  {
    title: "Curated Stays",
    description: "Hand-picked hotels with exclusive benefits and preferred rates.",
    icon: "🏨",
    link: "/dream-hotels",
  },
  {
    title: "Smart Itineraries",
    description: "Intelligently planned trips tailored to your preferences and style.",
    icon: "📍",
    link: "/concierge",
  },
];

const membershipTiers = [
  {
    name: "Explorer",
    price: "Free",
    period: "",
    features: ["Access to AI Concierge", "Save favorite hotels", "Basic trip planning"],
    highlight: false,
  },
  {
    name: "Voyager",
    price: "$29",
    period: "/month",
    features: ["Everything in Explorer", "Priority concierge support", "Exclusive member rates", "Room upgrades when available"],
    highlight: true,
  },
  {
    name: "Elite",
    price: "$99",
    period: "/month",
    features: ["Everything in Voyager", "Dedicated travel specialist", "Guaranteed upgrades", "VIP airport services", "Complimentary experiences"],
    highlight: false,
  },
];

const partners = ["VIRTUOSO", "EDITION", "PARK HYATT", "ĀMAN", "IHG", "ACCOR", "FOUR SEASONS", "PENINSULA"];

export default function HomePage() {
  const { isAuthenticated, logout } = useAuth();
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [lang, setLang] = useState<"EN" | "KR">("EN");

  return (
    <main className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative h-screen w-full overflow-visible">
        {/* Background Image */}
        <img
          src="https://images.unsplash.com/photo-1561238349-24053008a28e?w=1920&h=1080&fit=crop"
          alt="Luxury hotel"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/40 to-black/70" />

        {/* Top Bar */}
        <div className="relative z-10 flex h-[50px] items-center justify-between px-10" style={{ background: "rgba(0,0,0,0.3)" }}>
          <div className="flex items-center gap-6">
            <span className="text-[12px] font-medium text-white/70">support@tip-ai.com</span>
            <span className="text-[12px] text-white/50">|</span>
            <span className="text-[12px] font-medium text-white/70">+82 2-1234-5678</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLang(lang === "EN" ? "KR" : "EN")}
              className="text-[12px] font-medium text-white/70 transition-colors hover:text-white"
            >
              {lang === "EN" ? "EN" : "KR"} | {lang === "EN" ? "KR" : "EN"}
            </button>
            <span className="text-white/30">|</span>
            <button
              onClick={() => setShowSubscribe(true)}
              className="text-[12px] font-medium text-white/70 transition-colors hover:text-white"
            >
              SUBSCRIBE
            </button>
          </div>
        </div>

        {/* Nav Bar */}
        <nav className="relative z-10 flex h-[80px] items-center justify-between px-10">
          <Link href="/" className="font-primary text-[32px] font-bold text-white">
            TiP
          </Link>
          <div className="flex items-center gap-10">
            {mainNavLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-[11px] font-medium tracking-[2px] text-white/80 transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/my-page"
              className="text-[11px] font-medium tracking-[2px] text-white/80 transition-colors hover:text-white"
            >
              MY PAGE
            </Link>
            {isAuthenticated ? (
              <button
                onClick={logout}
                className="rounded-full border border-white/30 px-5 py-2 text-[11px] font-medium tracking-[1px] text-white transition-colors hover:bg-white/10"
              >
                LOG OUT
              </button>
            ) : (
              <Link
                href="/sign-in"
                className="rounded-full border border-white/30 px-5 py-2 text-[11px] font-medium tracking-[1px] text-white transition-colors hover:bg-white/10"
              >
                SIGN IN
              </Link>
            )}
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 flex flex-col items-start justify-end px-[100px] pb-[180px]" style={{ height: "calc(100% - 130px)" }}>
          <span className="mb-4 text-[11px] font-semibold tracking-[4px] text-gold">
            LUXURY TRAVEL REIMAGINED
          </span>
          <h1 className="max-w-3xl font-primary text-[64px] font-normal italic leading-[1.1] text-white">
            Dream Hotels, Thoughtfully Curated.
          </h1>
          <p className="mt-6 max-w-xl text-[16px] leading-[1.7] text-white/60">
            Experience the world&apos;s most extraordinary hotels, hand-selected by our
            AI concierge for unparalleled luxury and unforgettable moments.
          </p>
          <div className="mt-8 flex items-center gap-4">
            <Link
              href="/concierge"
              className="flex items-center gap-2 rounded-full bg-white px-8 py-4 text-[13px] font-semibold text-green-dark transition-opacity hover:opacity-90"
            >
              <span className="icon-lucide">&#xe986;</span>
              Start Planning
            </Link>
            <Link
              href="/dream-hotels"
              className="rounded-full border border-white/40 px-8 py-4 text-[13px] font-semibold text-white transition-colors hover:bg-white/10"
            >
              Explore Hotels
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <div className="absolute bottom-[60px] left-1/2 z-[100] w-[1280px] -translate-x-1/2">
          <SearchBar />
        </div>
      </section>

      {/* Luxury Section */}
      <section className="bg-gray-light px-[100px] py-20">
        <div className="mx-auto flex max-w-7xl items-start gap-20">
          {/* TiP Logo mark */}
          <div className="flex-shrink-0">
            <div className="flex h-[60px] w-[60px] items-center justify-center rounded-lg bg-green-dark">
              <span className="font-primary text-[24px] font-bold text-white">T</span>
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-1 items-start justify-between gap-16">
            <div className="max-w-md">
              <span className="text-[11px] font-semibold tracking-[4px] text-gold">
                THE TIP DIFFERENCE
              </span>
              <h2 className="mt-3 font-primary text-[38px] italic leading-snug text-green-dark">
                Travel Intelligence, Perfected
              </h2>
            </div>
            <div className="max-w-lg">
              <p className="text-[15px] leading-[1.8] text-gray-text">
                TiP combines cutting-edge AI with decades of luxury travel expertise.
                Our intelligent concierge learns your preferences, anticipates your needs,
                and crafts journeys that exceed expectations—every single time.
              </p>
              <p className="mt-4 text-[15px] leading-[1.8] text-gray-text">
                From securing the best suites to arranging exclusive experiences,
                we handle every detail so you can focus on what matters: enjoying the journey.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Elevate Section */}
      <section className="bg-[#F5F4F2] px-[100px] py-20">
        <div className="mx-auto max-w-7xl text-center">
          <span className="text-[11px] font-semibold tracking-[4px] text-gold">
            HOW IT WORKS
          </span>
          <h2 className="mt-3 font-primary text-[42px] italic text-green-dark">
            Elevate Your Journey
          </h2>
        </div>
        <div className="mx-auto mt-12 flex max-w-5xl justify-center gap-6">
          {elevateCards.map((card) => (
            <Link
              key={card.title}
              href={card.link}
              className="group flex-1 rounded-2xl bg-white p-8 shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="text-3xl">{card.icon}</span>
              <h3 className="mt-4 text-[18px] font-semibold text-green-dark">
                {card.title}
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed text-gray-text">
                {card.description}
              </p>
              <div className="mt-4 flex items-center gap-1 text-[13px] font-medium text-gold transition-colors group-hover:text-green-dark">
                Learn more
                <span className="icon-lucide text-sm">&#xe817;</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-light px-[100px] py-20">
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          {/* TiP Logo */}
          <div className="mb-6 flex h-[55px] w-[68px] items-center justify-center">
            <span className="font-primary text-[36px] font-bold text-green-dark">TiP</span>
          </div>
          <span className="text-[11px] font-semibold tracking-[4px] text-green-dark">
            BEGIN YOUR JOURNEY
          </span>
          <h2 className="mt-4 font-primary text-[52px] italic leading-tight text-[#3D3D3D]">
            Ready to explore the world?
          </h2>
          <p className="mt-4 max-w-xl text-[16px] leading-[1.7] text-gray-text">
            Let our AI concierge craft your perfect adventure, tailored to your
            preferences and style — anywhere in the world.
          </p>
          <div className="mt-8 flex items-center gap-4">
            <Link
              href="/concierge"
              className="flex items-center gap-2 rounded-full bg-green-dark px-8 py-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
            >
              <span className="icon-lucide">&#xe986;</span>
              Chat with Concierge
            </Link>
            <Link
              href="/dream-hotels"
              className="rounded-full border border-green-dark/30 px-8 py-4 text-[13px] font-semibold text-green-dark transition-colors hover:bg-green-dark/5"
            >
              Browse Hotels
            </Link>
          </div>
        </div>
      </section>

      {/* Membership Section */}
      <section className="bg-[#F5F4F2] px-[100px] py-16">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <span className="text-[11px] font-semibold tracking-[4px] text-gold">
              MEMBERSHIP
            </span>
            <h2 className="mt-3 font-primary text-[42px] italic text-green-dark">
              Join the TiP Experience
            </h2>
            <p className="mt-3 text-[15px] text-gray-text">
              Choose the membership that matches your travel style.
            </p>
          </div>

          <div className="mt-12 flex justify-center gap-6">
            {membershipTiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative flex w-[340px] flex-col rounded-2xl p-8 ${
                  tier.highlight
                    ? "bg-green-dark text-white shadow-lg"
                    : "bg-white shadow-sm"
                }`}
              >
                {tier.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gold px-4 py-1 text-[11px] font-semibold text-white">
                    RECOMMENDED
                  </span>
                )}
                <h3 className={`text-[20px] font-semibold ${tier.highlight ? "text-white" : "text-green-dark"}`}>
                  {tier.name}
                </h3>
                <div className="mt-4 flex items-baseline">
                  <span className={`text-[36px] font-bold ${tier.highlight ? "text-white" : "text-green-dark"}`}>
                    {tier.price}
                  </span>
                  <span className={`ml-1 text-[14px] ${tier.highlight ? "text-white/60" : "text-gray-text"}`}>
                    {tier.period}
                  </span>
                </div>
                <ul className="mt-6 flex flex-col gap-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <span className={`icon-lucide mt-0.5 text-sm ${tier.highlight ? "text-gold" : "text-green-dark"}`}>
                        &#xe86c;
                      </span>
                      <span className={`text-[14px] ${tier.highlight ? "text-white/80" : "text-gray-text"}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                <button
                  className={`mt-8 w-full rounded-full py-3 text-[13px] font-semibold transition-opacity hover:opacity-90 ${
                    tier.highlight
                      ? "bg-white text-green-dark"
                      : "bg-green-dark text-white"
                  }`}
                >
                  {tier.price === "Free" ? "Get Started" : "Subscribe"}
                </button>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 text-gray-text">
            <span className="icon-lucide text-sm">&#xea7c;</span>
            <span className="text-[13px]">Scroll for more features</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#214032] px-[100px] py-12">
        <div className="mx-auto max-w-7xl">
          {/* Top */}
          <div className="flex items-start justify-between">
            <Link href="/" className="font-primary text-[28px] font-bold text-white">
              TiP
            </Link>
            <div className="flex gap-20">
              <div>
                <h4 className="text-[13px] font-semibold text-white/60">Explore</h4>
                <div className="mt-4 flex flex-col gap-3">
                  <Link href="/dream-hotels" className="text-[13px] text-white/40 hover:text-white/70">
                    Dream Hotels
                  </Link>
                  <Link href="/insights" className="text-[13px] text-white/40 hover:text-white/70">
                    Insights
                  </Link>
                  <Link href="/concierge" className="text-[13px] text-white/40 hover:text-white/70">
                    AI Chat
                  </Link>
                </div>
              </div>
              <div>
                <h4 className="text-[13px] font-semibold text-white/60">Company</h4>
                <div className="mt-4 flex flex-col gap-3">
                  <Link href="#" className="text-[13px] text-white/40 hover:text-white/70">
                    About Us
                  </Link>
                  <Link href="#" className="text-[13px] text-white/40 hover:text-white/70">
                    Careers
                  </Link>
                  <Link href="#" className="text-[13px] text-white/40 hover:text-white/70">
                    Press
                  </Link>
                </div>
              </div>
              <div>
                <h4 className="text-[13px] font-semibold text-white/60">Support</h4>
                <div className="mt-4 flex flex-col gap-3">
                  <Link href="#" className="text-[13px] text-white/40 hover:text-white/70">
                    Help Center
                  </Link>
                  <Link href="#" className="text-[13px] text-white/40 hover:text-white/70">
                    Contact Us
                  </Link>
                  <Link href="#" className="text-[13px] text-white/40 hover:text-white/70">
                    Privacy Policy
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="mt-10 border-t border-white/10 pt-6 text-[12px] leading-[1.8] text-white/40">
            <p>상호명: 주식회사 티아이피에이아이 | 대표: 홍길동 | 사업자등록번호: 123-45-67890</p>
            <p>주소: 서울특별시 강남구 테헤란로 123, 4층 | 통신판매업신고: 제2026-서울강남-00001호</p>
          </div>

          {/* Copyright */}
          <div className="mt-6 text-center text-[12px] text-white/30">
            © 2026 TiP AI. Crafted for discerning travelers.
          </div>
        </div>
      </footer>

      {/* Modals */}
      <SubscribePopup isOpen={showSubscribe} onClose={() => setShowSubscribe(false)} />
    </main>
  );
}
