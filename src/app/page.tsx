'use client';

import Link from 'next/link';
import Image from 'next/image';
import SearchBar from '@/components/SearchBar';
import { useLanguage } from '@/contexts/LanguageContext';

const elevateCards = [
  {
    titleKey: 'home.card_ai_title',
    descriptionKey: 'home.card_ai_body',
    icon: '✨',
    link: '/concierge',
  },
  {
    titleKey: 'home.card_stays_title',
    descriptionKey: 'home.card_stays_body',
    icon: '🏨',
    link: '/dream-hotels',
  },
  {
    titleKey: 'home.card_itineraries_title',
    descriptionKey: 'home.card_itineraries_body',
    icon: '📍',
    link: '/concierge',
  },
] as const;

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
    cta: { en: 'Learn More', kr: '자세히 보기' },
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

type Partner = { name: string; slug: string; logo: string };

// Curated luxury hotel-brand + travel-network partner logos.
// Brand names are universal (never translated). Assets are static files
// under /public/partners/ — no runtime/API fetch.
const partners: Partner[] = [
  { name: 'Aman', slug: 'aman', logo: '/partners/aman.jpg' },
  { name: 'Janu', slug: 'janu', logo: '/partners/janu.jpg' },
  { name: 'Four Seasons', slug: 'four-seasons', logo: '/partners/four-seasons.jpg' },
  { name: 'Mandarin Oriental', slug: 'mandarin-oriental', logo: '/partners/mandarin-oriental.png' },
  { name: 'The Peninsula', slug: 'the-peninsula', logo: '/partners/the-peninsula.png' },
  { name: 'Rosewood', slug: 'rosewood', logo: '/partners/rosewood.png' },
  { name: 'Raffles', slug: 'raffles', logo: '/partners/raffles.png' },
  { name: 'Shangri-La', slug: 'shangri-la', logo: '/partners/shangri-la.png' },
  { name: 'St. Regis', slug: 'st-regis', logo: '/partners/st-regis.jpg' },
  { name: 'The Ritz-Carlton', slug: 'ritz-carlton', logo: '/partners/ritz-carlton.jpg' },
  {
    name: 'The Ritz-Carlton Yacht Collection',
    slug: 'ritz-carlton-yacht-collection',
    logo: '/partners/ritz-carlton-yacht-collection.jpg',
  },
  { name: 'Bulgari Hotels & Resorts', slug: 'bulgari', logo: '/partners/bulgari.jpg' },
  { name: 'Cheval Blanc', slug: 'cheval-blanc', logo: '/partners/cheval-blanc.jpg' },
  {
    name: 'Dorchester Collection',
    slug: 'dorchester-collection',
    logo: '/partners/dorchester-collection.png',
  },
  {
    name: 'Oetker Collection',
    slug: 'oetker-collection',
    logo: '/partners/oetker-collection.png',
  },
  {
    name: 'Auberge Collection',
    slug: 'auberge-collection',
    logo: '/partners/auberge-collection.png',
  },
  { name: 'Belmond', slug: 'belmond', logo: '/partners/belmond.png' },
  { name: 'Six Senses', slug: 'six-senses', logo: '/partners/six-senses.png' },
  { name: 'Soneva', slug: 'soneva', logo: '/partners/soneva.jpg' },
  { name: 'Singita', slug: 'singita', logo: '/partners/singita.jpg' },
  { name: 'Fairmont', slug: 'fairmont', logo: '/partners/fairmont.jpg' },
  { name: 'Upper House', slug: 'upper-house', logo: '/partners/upper-house.png' },
  { name: 'Hoshino Resorts', slug: 'hoshino-resorts', logo: '/partners/hoshino-resorts.jpg' },
  { name: 'Virtuoso', slug: 'virtuoso', logo: '/partners/virtuoso.png' },
  { name: 'IATA', slug: 'iata', logo: '/partners/iata.png' },
  {
    name: 'Marriott Stars & Luminous',
    slug: 'marriott-stars-luminous',
    logo: '/partners/marriott-stars-luminous.jpg',
  },
  { name: 'IHG Destined', slug: 'ihg-destined', logo: '/partners/ihg-destined.jpg' },
  {
    name: 'Accor HERA Travel Advisor Program',
    slug: 'accor-hera',
    logo: '/partners/accor-hera.jpg',
  },
  {
    name: 'Switzerland Tourism',
    slug: 'switzerland-tourism',
    logo: '/partners/switzerland-tourism.png',
  },
  { name: 'Lotte Duty Free', slug: 'lotte-duty-free', logo: '/partners/lotte-duty-free.jpg' },
  { name: 'The Hyundai', slug: 'the-hyundai', logo: '/partners/the-hyundai.jpg' },
];

export default function HomePage() {
  const { lang, t } = useLanguage();
  const isEn = lang === 'en';

  return (
    <main className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative h-screen w-full overflow-visible">
        {/* Background Image */}
        <Image
          src="https://images.unsplash.com/photo-1561238349-24053008a28e?w=1920&h=1080&fit=crop"
          alt={t('home.hero_alt')}
          className="absolute inset-0 object-cover"
          fill
          sizes="100vw"
          priority
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/40 to-black/70" />

        {/* Hero Content — sits beneath the 64px centralized overlay header */}
        <div
          className="relative z-10 mt-[64px] flex flex-col items-start justify-end px-6 pb-28 sm:px-10 lg:px-[100px] lg:pb-[180px]"
          style={{ height: 'calc(100% - 64px)' }}
        >
          <span className="mb-4 text-[11px] font-semibold tracking-[4px] text-gold">
            {t('home.hero_overline')}
          </span>
          <h1 className="max-w-3xl font-primary text-[36px] font-normal italic leading-[1.1] text-white md:text-[48px] lg:text-[64px]">
            {t('home.hero_title')}
          </h1>
          <p className="mt-6 max-w-xl text-[16px] leading-[1.7] text-white/60">
            {t('home.hero_subtitle')}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/concierge"
              className="flex items-center gap-2 rounded-full bg-white px-8 py-4 text-[13px] font-semibold text-green-dark transition-opacity hover:opacity-90"
            >
              <span className="icon-lucide">&#xe986;</span>
              {t('home.start_planning')}
            </Link>
            <Link
              href="/dream-hotels"
              className="rounded-full border border-white/40 px-8 py-4 text-[13px] font-semibold text-white transition-colors hover:bg-white/10"
            >
              {t('home.explore_hotels')}
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <div className="absolute bottom-[40px] left-1/2 z-[100] w-full max-w-[1280px] -translate-x-1/2 px-6 sm:px-10 lg:bottom-[60px] lg:px-0">
          <SearchBar />
        </div>
      </section>

      {/* Luxury Section */}
      <section className="bg-gray-light px-6 py-16 sm:px-10 lg:px-[100px] lg:py-20">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-10 md:flex-row md:gap-20">
          {/* TiP Logo mark */}
          <div className="flex-shrink-0">
            <Image
              src="/bible_TIP_profil_400x400px.svg"
              alt={t('home.logo_alt')}
              className="h-[60px] w-[60px]"
              width={60}
              height={60}
            />
          </div>

          {/* Content */}
          <div className="flex flex-1 flex-col items-start justify-between gap-8 lg:flex-row lg:gap-16">
            <div className="max-w-md">
              <span className="text-[11px] font-semibold tracking-[4px] text-gold">
                {t('home.difference_overline')}
              </span>
              <h2 className="mt-3 font-primary text-[28px] italic leading-snug text-green-dark md:text-[38px]">
                {t('home.difference_title')}
              </h2>
            </div>
            <div className="max-w-lg">
              <p className="text-[15px] leading-[1.8] text-gray-text">
                {t('home.difference_body1')}
              </p>
              <p className="mt-4 text-[15px] leading-[1.8] text-gray-text">
                {t('home.difference_body2')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Elevate Section */}
      <section className="bg-[#F5F4F2] px-6 py-16 sm:px-10 lg:px-[100px] lg:py-20">
        <div className="mx-auto max-w-7xl text-center">
          <span className="text-[11px] font-semibold tracking-[4px] text-gold">
            {t('home.how_it_works')}
          </span>
          <h2 className="mt-3 font-primary text-[28px] italic text-green-dark md:text-[36px] lg:text-[42px]">
            {t('home.elevate_title')}
          </h2>
        </div>
        <div className="mx-auto mt-12 flex max-w-5xl flex-col justify-center gap-6 sm:flex-row">
          {elevateCards.map((card) => (
            <Link
              key={card.titleKey}
              href={card.link}
              className="group flex-1 rounded-2xl bg-white p-8 shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="text-3xl">{card.icon}</span>
              <h3 className="mt-4 text-[18px] font-semibold text-green-dark">{t(card.titleKey)}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-gray-text">
                {t(card.descriptionKey)}
              </p>
              <div className="mt-4 flex items-center gap-1 text-[13px] font-medium text-gold transition-colors group-hover:text-green-dark">
                {t('home.learn_more')}
                <span className="icon-lucide text-sm">&#xe817;</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-light px-6 py-16 sm:px-10 lg:px-[100px] lg:py-20">
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          {/* TiP Logo */}
          <div className="mb-6">
            <Image
              src="/bible_TIP_logo_noir.svg"
              alt={t('home.logo_alt')}
              className="h-[60px]"
              width={180}
              height={60}
            />
          </div>
          <span className="text-[11px] font-semibold tracking-[4px] text-green-dark">
            {t('home.cta_overline')}
          </span>
          <h2 className="mt-4 font-primary text-[32px] italic leading-tight text-[#3D3D3D] md:text-[42px] lg:text-[52px]">
            {t('home.cta_title')}
          </h2>
          <p className="mt-4 max-w-xl text-[16px] leading-[1.7] text-gray-text">
            {t('home.cta_body')}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/concierge"
              className="flex items-center gap-2 rounded-full bg-green-dark px-8 py-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
            >
              <span className="icon-lucide">&#xe986;</span>
              {t('home.chat_with_concierge')}
            </Link>
            <Link
              href="/dream-hotels"
              className="rounded-full border border-green-dark/30 px-8 py-4 text-[13px] font-semibold text-green-dark transition-colors hover:bg-green-dark/5"
            >
              {t('home.browse_hotels')}
            </Link>
          </div>
        </div>
      </section>

      {/* Membership Section — Les Quatre Cercles */}
      <section className="bg-[#F5F4F2] px-6 py-20 md:px-[100px]">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <span className="text-[11px] font-semibold tracking-[4px] text-gold">
              {isEn ? 'TIP MEMBERSHIP' : 'TIP 멤버십'}
            </span>
            <h2 className="mt-3 font-primary text-[42px] italic leading-tight text-green-dark md:text-[52px]">
              {t('home.membership_brand')}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-gray-text">
              {isEn
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
                      {isEn ? 'Recommended' : '추천'}
                    </span>
                  )}
                  {isPrivate && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gold px-4 py-1 text-[10px] font-semibold uppercase tracking-[3px] text-white">
                      {isEn ? 'By Invitation' : '초대 전용'}
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
                    {circle.tagline[isEn ? 'en' : 'kr']}
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
                      {circle.price[isEn ? 'en' : 'kr']}
                    </p>
                    <p
                      className={`mt-1 text-[11px] leading-relaxed ${
                        isPrivate ? 'text-white/60' : 'text-gray-text'
                      }`}
                    >
                      {circle.qualifying[isEn ? 'en' : 'kr']}
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
                          {benefit[isEn ? 'en' : 'kr']}
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
                    {circle.cta[isEn ? 'en' : 'kr']}
                  </Link>
                </div>
              );
            })}
          </div>

          <p className="mt-12 text-center font-primary text-[18px] italic text-green-dark/70">
            {isEn ? 'Every circle brings you closer.' : '모든 서클은 당신을 더 가까이 불러옵니다.'}
          </p>
        </div>
      </section>

      {/* Our Partners Section — auto-scrolling logo marquee */}
      <section className="bg-gray-light px-6 py-16 md:px-[100px] md:py-20">
        <div className="mx-auto max-w-7xl text-center">
          <span className="text-[11px] font-semibold tracking-[4px] text-gold">
            {isEn ? 'IN GOOD COMPANY' : '함께하는 브랜드'}
          </span>
          <h2 className="mt-3 font-primary text-[38px] italic leading-tight text-green-dark md:text-[42px]">
            {isEn ? 'Our Partners' : '파트너'}
          </h2>
        </div>

        {/* The marquee. The track holds the logo list twice; the -50% keyframe
            (globals.css) loops seamlessly. Hover pauses it; prefers-reduced-motion
            disables the animation entirely. */}
        <div
          className="marquee group relative mt-12 overflow-hidden"
          aria-label={t('home.partner_brands_aria')}
        >
          {/* Edge fades so logos enter/exit softly rather than clipping hard */}
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-gray-light to-transparent md:w-24" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-gray-light to-transparent md:w-24" />

          <div className="marquee-track flex w-max items-center">
            {[...partners, ...partners].map((partner, idx) => (
              <div
                key={`${partner.slug}-${idx}`}
                aria-hidden={idx >= partners.length}
                className="flex h-16 w-[140px] flex-shrink-0 items-center justify-center px-6 md:w-[180px]"
              >
                <Image
                  src={partner.logo}
                  alt={partner.name}
                  width={160}
                  height={64}
                  loading="eager"
                  className="max-h-12 w-auto object-contain opacity-50 grayscale transition duration-300 hover:opacity-100 hover:grayscale-0"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#214032] px-6 py-12 sm:px-10 lg:px-[100px]">
        <div className="mx-auto max-w-7xl">
          {/* Top */}
          <div className="flex flex-col items-start gap-10 md:flex-row md:justify-between">
            <Link href="/">
              <Image
                src="/bible_TIP_logo_noir.svg"
                alt={t('home.footer_logo_alt')}
                className="h-10"
                width={120}
                height={40}
                style={{ filter: 'brightness(0) invert(1)' }}
              />
            </Link>
            <div className="flex flex-wrap gap-x-12 gap-y-8 sm:gap-x-20">
              <div>
                <h4 className="text-[13px] font-semibold text-white/60">
                  {t('home.footer_explore')}
                </h4>
                <div className="mt-4 flex flex-col gap-3">
                  <Link
                    href="/dream-hotels"
                    className="text-[13px] text-white/40 hover:text-white/70"
                  >
                    {t('home.footer_dream_hotels')}
                  </Link>
                  <Link href="/about" className="text-[13px] text-white/40 hover:text-white/70">
                    {t('home.footer_about')}
                  </Link>
                  <Link href="/concierge" className="text-[13px] text-white/40 hover:text-white/70">
                    {t('home.footer_concierge')}
                  </Link>
                </div>
              </div>
              <div>
                <h4 className="text-[13px] font-semibold text-white/60">
                  {t('home.footer_company')}
                </h4>
                <div className="mt-4 flex flex-col gap-3">
                  <Link href="/about" className="text-[13px] text-white/40 hover:text-white/70">
                    {t('home.footer_about_us')}
                  </Link>
                  <Link href="#" className="text-[13px] text-white/40 hover:text-white/70">
                    {t('home.footer_careers')}
                  </Link>
                  <Link href="#" className="text-[13px] text-white/40 hover:text-white/70">
                    {t('home.footer_press')}
                  </Link>
                </div>
              </div>
              <div>
                <h4 className="text-[13px] font-semibold text-white/60">
                  {t('home.footer_support')}
                </h4>
                <div className="mt-4 flex flex-col gap-3">
                  <Link href="#" className="text-[13px] text-white/40 hover:text-white/70">
                    {t('home.footer_help_center')}
                  </Link>
                  <Link href="#" className="text-[13px] text-white/40 hover:text-white/70">
                    {t('home.footer_contact_us')}
                  </Link>
                  <Link href="#" className="text-[13px] text-white/40 hover:text-white/70">
                    {t('home.footer_privacy')}
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
            {t('home.footer_copyright')}
          </div>
        </div>
      </footer>
    </main>
  );
}
