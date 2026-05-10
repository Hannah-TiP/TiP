'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import SearchBar from '@/components/SearchBar';
import SubscribePopup from '@/components/SubscribePopup';
import { useSession, signOut } from 'next-auth/react';

const mainNavLinks = [
  { label: 'DREAM HOTELS', href: '/dream-hotels' },
  { label: 'MORE DREAMS', href: '/more-dreams' },
  { label: 'INSIGHTS', href: '/insights' },
];

const elevateCards = [
  {
    title: 'AI Concierge',
    description: 'Your personal travel assistant, available 24/7 to craft the perfect journey.',
    icon: '✨',
    link: '/concierge',
  },
  {
    title: 'Curated Stays',
    description: 'Hand-picked hotels with exclusive benefits and preferred rates.',
    icon: '🏨',
    link: '/dream-hotels',
  },
  {
    title: 'Smart Itineraries',
    description: 'Intelligently planned trips tailored to your preferences and style.',
    icon: '📍',
    link: '/concierge',
  },
];

type Bilingual = { en: string; kr: string };

type MembershipCircle = {
  key: 'carte' | 'cercle' | 'confidence' | 'cenacle';
  name: string; // not translated — circles keep their French identity
  tagline: Bilingual;
  price: Bilingual;
  qualifying: Bilingual;
  benefits: Bilingual[]; // 5 highlights per circle; full list lives on /my-page/membership
  emphasis: 'soft' | 'recommended' | 'private';
  cta: Bilingual;
  ctaHref: string;
};

const membershipCircles: MembershipCircle[] = [
  {
    key: 'carte',
    name: 'Carte',
    tagline: {
      en: 'Your entry into TiP.',
      kr: '여정이 시작되는 곳',
    },
    price: { en: 'Free', kr: '무료' },
    qualifying: {
      en: 'Complimentary with your first TiP booking.',
      kr: '첫 TiP 예약과 함께 자동 가입',
    },
    benefits: [
      {
        en: 'Preferred rates at 2,200+ partner hotels',
        kr: '전 세계 2,200개 이상 파트너 호텔 특별 요금',
      },
      { en: 'Daily breakfast for two', kr: '매일 조식 2인 포함' },
      { en: '$100 stay credit per booking', kr: '스테이당 $100 호텔 크레딧' },
      { en: 'Room upgrade when available', kr: '객실 업그레이드 (가능 시)' },
      {
        en: 'Early check-in & late check-out when available',
        kr: '얼리 체크인 · 레이트 체크아웃 (가능 시)',
      },
    ],
    emphasis: 'soft',
    cta: { en: 'Get Started', kr: '시작하기' },
    ctaHref: '/sign-in',
  },
  {
    key: 'cercle',
    name: 'Cercle',
    tagline: {
      en: 'Where TiP learns your style.',
      kr: '당신의 취향이 스테이를 설계하기 시작하는 곳',
    },
    price: { en: 'Free', kr: '무료' },
    qualifying: {
      en: '$20,000 in annual TiP bookings, or by member referral.',
      kr: '연간 $20,000 이상의 TiP 예약, 또는 멤버 추천',
    },
    benefits: [
      { en: 'Up to $200 stay credit per booking', kr: '스테이당 최대 $200 크레딧' },
      {
        en: 'Hotel Whisperer — best room, told to you 24h before arrival',
        kr: '호텔 위스퍼러 — 도착 24시간 전 최적의 객실 안내',
      },
      {
        en: 'Personalized arrival — pillow, scent, flowers',
        kr: '어라이벌 리추얼 — 베개 · 향 · 플라워 맞춤',
      },
      {
        en: 'Birthday Stay — credit + private welcome',
        kr: '버스데이 스테이 — 전용 크레딧과 환영',
      },
      {
        en: 'Concierge Swap — request anything in Korean, day or night',
        kr: '콩시에르주 스왑 — 한국어로 24시간 요청',
      },
    ],
    emphasis: 'soft',
    cta: { en: 'Learn More', kr: '자세히 보기' },
    ctaHref: '/my-page/membership',
  },
  {
    key: 'confidence',
    name: 'Confidence',
    tagline: {
      en: 'The hotel already knows you.',
      kr: '호텔이 이미 당신을 아는 곳',
    },
    price: { en: '₩3,500,000 / year', kr: '연 ₩3,500,000' },
    qualifying: {
      en: '$60,000 in annual bookings, or 12+ months as Cercle.',
      kr: '연간 $60,000 이상, 또는 Cercle 멤버십 12개월 이상',
    },
    benefits: [
      { en: 'Up to $300 stay credit per booking', kr: '스테이당 최대 $300 크레딧' },
      {
        en: 'Pre-Stay Call — 15 min with your Travel Designer',
        kr: '프리 스테이 콜 — 트래블 디자이너와 15분 통화',
      },
      {
        en: 'Dedicated Travel Designer for every itinerary',
        kr: '데디케이티드 트래블 디자이너',
      },
      {
        en: 'Guaranteed 4pm checkout at every TiP partner hotel',
        kr: '모든 파트너 호텔 오후 4시 체크아웃 보장',
      },
      {
        en: 'Consortium benefits — Virtuoso, Four Seasons Preferred, Rosewood Elite',
        kr: '컨소시엄 혜택 — Virtuoso, Four Seasons Preferred, Rosewood Elite',
      },
    ],
    emphasis: 'recommended',
    cta: { en: 'Request Confidence', kr: 'Confidence 신청' },
    ctaHref: '/my-page/membership',
  },
  {
    key: 'cenacle',
    name: 'Cénacle',
    tagline: {
      en: 'The inner circle.',
      kr: '초대로만 열리는 가장 안쪽의 원',
    },
    price: { en: '₩12,000,000 / year', kr: '연 ₩12,000,000' },
    qualifying: {
      en: 'By invitation only. Limited to 10 new members per year.',
      kr: '초대로만. 연간 최대 10명에게만 초대',
    },
    benefits: [
      { en: 'Up to $500 stay credit per booking', kr: '스테이당 최대 $500 크레딧' },
      {
        en: 'Empty Room Guarantee — even when sold out',
        kr: '엠프티 룸 개런티 — 매진 시에도 객실 확보',
      },
      {
        en: 'First Night Privilege — Aman, Rosewood, Cheval Blanc, Six Senses',
        kr: '퍼스트 나이트 프리빌리지 — 신규 오프닝 프리오프닝',
      },
      {
        en: 'Anonymous check-in — no name, no ID, private entrances',
        kr: '어노니머스 체크인 — 익명 입실',
      },
      { en: '24/7 dedicated advisor — one person, every detail', kr: '24시간 전담 어드바이저' },
    ],
    emphasis: 'private',
    cta: { en: 'By Invitation', kr: '초대 전용' },
    ctaHref: '/my-page/membership',
  },
];

export default function HomePage() {
  const { data: session } = useSession();
  const isAuthenticated = !!session;
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [lang, setLang] = useState<'EN' | 'KR'>('EN');

  return (
    <main className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative h-screen w-full overflow-visible">
        {/* Background Image */}
        <Image
          src="https://images.unsplash.com/photo-1561238349-24053008a28e?w=1920&h=1080&fit=crop"
          alt="Luxury hotel"
          className="absolute inset-0 object-cover"
          fill
          sizes="100vw"
          priority
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/40 to-black/70" />

        {/* Top Bar */}
        <div
          className="relative z-10 flex h-[50px] items-center justify-between px-10"
          style={{ background: 'rgba(0,0,0,0.3)' }}
        >
          <div className="flex items-center gap-6">
            <span className="text-[12px] font-medium text-white/70">support@tip-ai.com</span>
            <span className="text-[12px] text-white/50">|</span>
            <span className="text-[12px] font-medium text-white/70">+82 2-1234-5678</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLang(lang === 'EN' ? 'KR' : 'EN')}
              className="text-[12px] font-medium text-white/70 transition-colors hover:text-white"
            >
              {lang === 'EN' ? 'EN' : 'KR'} | {lang === 'EN' ? 'KR' : 'EN'}
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
          <Link href="/">
            <Image
              src="/bible_TIP_profil_400x400px.svg"
              alt="TiP"
              className="h-10"
              width={40}
              height={40}
              style={{ filter: 'brightness(0) invert(1)' }}
            />
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
                onClick={() => signOut({ callbackUrl: '/' })}
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
        <div
          className="relative z-10 flex flex-col items-start justify-end px-[100px] pb-[180px]"
          style={{ height: 'calc(100% - 130px)' }}
        >
          <span className="mb-4 text-[11px] font-semibold tracking-[4px] text-gold">
            LUXURY TRAVEL REIMAGINED
          </span>
          <h1 className="max-w-3xl font-primary text-[64px] font-normal italic leading-[1.1] text-white">
            Dream Hotels, Thoughtfully Curated.
          </h1>
          <p className="mt-6 max-w-xl text-[16px] leading-[1.7] text-white/60">
            Experience the world&apos;s most extraordinary hotels, hand-selected by our AI concierge
            for unparalleled luxury and unforgettable moments.
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
            <Image
              src="/bible_TIP_profil_400x400px.svg"
              alt="TiP"
              className="h-[60px] w-[60px]"
              width={60}
              height={60}
            />
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
                TiP combines cutting-edge AI with decades of luxury travel expertise. Our
                intelligent concierge learns your preferences, anticipates your needs, and crafts
                journeys that exceed expectations—every single time.
              </p>
              <p className="mt-4 text-[15px] leading-[1.8] text-gray-text">
                From securing the best suites to arranging exclusive experiences, we handle every
                detail so you can focus on what matters: enjoying the journey.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Elevate Section */}
      <section className="bg-[#F5F4F2] px-[100px] py-20">
        <div className="mx-auto max-w-7xl text-center">
          <span className="text-[11px] font-semibold tracking-[4px] text-gold">HOW IT WORKS</span>
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
              <h3 className="mt-4 text-[18px] font-semibold text-green-dark">{card.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-gray-text">{card.description}</p>
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
          <div className="mb-6">
            <Image
              src="/bible_TIP_logo_noir.svg"
              alt="TiP"
              className="h-[60px]"
              width={180}
              height={60}
            />
          </div>
          <span className="text-[11px] font-semibold tracking-[4px] text-green-dark">
            BEGIN YOUR JOURNEY
          </span>
          <h2 className="mt-4 font-primary text-[52px] italic leading-tight text-[#3D3D3D]">
            Ready to explore the world?
          </h2>
          <p className="mt-4 max-w-xl text-[16px] leading-[1.7] text-gray-text">
            Let our AI concierge craft your perfect adventure, tailored to your preferences and
            style — anywhere in the world.
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

      {/* Membership Section — Les Quatre Cercles */}
      <section className="bg-[#F5F4F2] px-6 py-20 md:px-[100px]">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <span className="text-[11px] font-semibold tracking-[4px] text-gold">
              {lang === 'EN' ? 'TIP MEMBERSHIP' : 'TIP 멤버십'}
            </span>
            <h2 className="mt-3 font-primary text-[42px] italic leading-tight text-green-dark md:text-[52px]">
              Les Quatre Cercles
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-gray-text">
              {lang === 'EN'
                ? 'Four circles. Each opens differently. Every stay is recognized, every preference remembered.'
                : '네 개의 원, 각기 다른 방식으로 열립니다. 모든 스테이는 특별하게 기억되고, 모든 취향은 섬세하게 반영됩니다.'}
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {membershipCircles.map((circle) => {
              const isPrivate = circle.emphasis === 'private';
              const isRecommended = circle.emphasis === 'recommended';
              return (
                <div
                  key={circle.key}
                  className={`relative flex flex-col rounded-2xl p-8 transition-shadow ${
                    isPrivate
                      ? 'bg-green-dark text-white shadow-lg'
                      : isRecommended
                        ? 'bg-white shadow-md ring-1 ring-gold/40'
                        : 'bg-white shadow-sm'
                  }`}
                >
                  {isRecommended && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gold px-4 py-1 text-[10px] font-semibold uppercase tracking-[3px] text-white">
                      {lang === 'EN' ? 'Recommended' : '추천'}
                    </span>
                  )}
                  {isPrivate && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gold px-4 py-1 text-[10px] font-semibold uppercase tracking-[3px] text-white">
                      {lang === 'EN' ? 'By Invitation' : '초대 전용'}
                    </span>
                  )}

                  <div className="mb-1 text-[10px] font-semibold tracking-[3px] text-gold">◆</div>
                  <h3
                    className={`font-primary text-[28px] italic leading-tight ${
                      isPrivate ? 'text-white' : 'text-green-dark'
                    }`}
                  >
                    {circle.name}
                  </h3>
                  <p
                    className={`mt-2 min-h-[40px] text-[13px] leading-relaxed ${
                      isPrivate ? 'text-white/70' : 'text-gray-text'
                    }`}
                  >
                    {circle.tagline[lang === 'EN' ? 'en' : 'kr']}
                  </p>

                  <div
                    className={`mt-5 border-t pt-4 ${
                      isPrivate ? 'border-white/20' : 'border-gray-border'
                    }`}
                  >
                    <p
                      className={`text-[20px] font-semibold ${
                        isPrivate ? 'text-white' : 'text-green-dark'
                      }`}
                    >
                      {circle.price[lang === 'EN' ? 'en' : 'kr']}
                    </p>
                    <p
                      className={`mt-1 text-[11px] leading-relaxed ${
                        isPrivate ? 'text-white/60' : 'text-gray-text'
                      }`}
                    >
                      {circle.qualifying[lang === 'EN' ? 'en' : 'kr']}
                    </p>
                  </div>

                  <ul className="mt-6 flex flex-1 flex-col gap-3">
                    {circle.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span
                          className={`mt-1.5 inline-block h-1 w-1 flex-shrink-0 rounded-full ${
                            isPrivate ? 'bg-gold' : 'bg-green-dark/60'
                          }`}
                        />
                        <span
                          className={`text-[13px] leading-relaxed ${
                            isPrivate ? 'text-white/80' : 'text-gray-text'
                          }`}
                        >
                          {benefit[lang === 'EN' ? 'en' : 'kr']}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={circle.ctaHref}
                    className={`mt-8 inline-block rounded-full py-3 text-center text-[12px] font-semibold uppercase tracking-[2px] transition-opacity hover:opacity-90 ${
                      isPrivate
                        ? 'bg-gold text-green-dark'
                        : isRecommended
                          ? 'bg-green-dark text-white'
                          : 'border border-green-dark/30 text-green-dark'
                    }`}
                  >
                    {circle.cta[lang === 'EN' ? 'en' : 'kr']}
                  </Link>
                </div>
              );
            })}
          </div>

          <p className="mt-12 text-center font-primary text-[18px] italic text-green-dark/70">
            {lang === 'EN'
              ? 'Every circle brings you closer.'
              : '모든 서클은 당신을 더 가까이 불러옵니다.'}
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#214032] px-[100px] py-12">
        <div className="mx-auto max-w-7xl">
          {/* Top */}
          <div className="flex items-start justify-between">
            <Link href="/">
              <Image
                src="/bible_TIP_logo_noir.svg"
                alt="TiP"
                className="h-10"
                width={120}
                height={40}
                style={{ filter: 'brightness(0) invert(1)' }}
              />
            </Link>
            <div className="flex gap-20">
              <div>
                <h4 className="text-[13px] font-semibold text-white/60">Explore</h4>
                <div className="mt-4 flex flex-col gap-3">
                  <Link
                    href="/dream-hotels"
                    className="text-[13px] text-white/40 hover:text-white/70"
                  >
                    Dream Hotels
                  </Link>
                  <Link href="/insights" className="text-[13px] text-white/40 hover:text-white/70">
                    Insights
                  </Link>
                  <Link href="/concierge" className="text-[13px] text-white/40 hover:text-white/70">
                    Concierge
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
            <p>
              주소: 서울특별시 강남구 테헤란로 123, 4층 | 통신판매업신고: 제2026-서울강남-00001호
            </p>
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
