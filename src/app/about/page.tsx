'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';

type Bilingual = { en: string; kr: string };

// ── Page copy ─────────────────────────────────────────────────────────────
//
// All bilingual strings live as inline `Bilingual` objects (the same pattern
// the landing page uses for long-form copy). Short reusable nav strings come
// from the i18n JSON via the existing LanguageContext, but the marketing
// prose stays local so the page reads top-to-bottom in one file.

const COPY = {
  hero: {
    eyebrow: { en: 'Our Story', kr: '우리의 이야기' },
    titleLine1: { en: 'Travel,', kr: '여행을,' },
    titleLine2: { en: 'Thoughtfully Redefined', kr: '다시 정의하다' },
    desc: {
      en: 'Travel in your Pocket is where AI concierge meets human curation. Through 2,200+ curated partner hotels and an exclusive lifestyle network, we craft journeys designed exclusively for you.',
      kr: 'Travel in your Pocket은 AI 컨시어지와 인간의 큐레이션이 결합된 럭셔리 트래블 플랫폼입니다. 2,200개 이상의 선별된 파트너 호텔과 독점 라이프스타일 네트워크를 통해 오직 당신만을 위한 여행을 설계합니다.',
    },
    cta: { en: 'Begin your journey', kr: '여행을 시작하세요' },
  },
  stats: [
    {
      num: '2,200+',
      label: { en: 'Curated Partner Hotels', kr: '선별된 파트너 호텔' },
      desc: {
        en: "World's finest luxury hotels across the Virtuoso network and independent contracts.",
        kr: 'Virtuoso 네트워크 및 독립 계약 호텔을 포함한 전 세계 최상위 럭셔리 호텔.',
      },
    },
    {
      num: '24/7',
      label: { en: 'Dedicated Concierge', kr: '전담 컨시어지 응대' },
      desc: {
        en: 'AI concierge and dedicated human travel specialists, available any time.',
        kr: 'AI 컨시어지와 전담 트래블 스페셜리스트가 언제든지 대기.',
      },
    },
    {
      num: '∞',
      label: { en: 'Hyper-Personalized Journeys', kr: '초개인화된 여행 경험' },
      desc: {
        en: 'Recommendations that grow more refined with every journey you take.',
        kr: '멤버의 히스토리와 취향을 학습해 매번 더 정교해지는 여행 추천.',
      },
    },
  ],
  story: {
    eyebrow: { en: 'Our Story', kr: '우리의 이야기' },
    titleLeft: { en: 'Why', kr: '왜' },
    titleEm: { en: 'Travel in your Pocket', kr: 'Travel in your Pocket' },
    body1: {
      en: 'Luxury travel is not simply about staying in expensive hotels. It is knowledge, timing, and relationships — a table at the restaurant no one tells you about, a room experienced before the official opening, a route only locals know.',
      kr: '럭셔리 여행은 단순히 비싼 호텔에 묵는 것이 아닙니다. 그것은 지식이고, 타이밍이며, 관계입니다. 아무도 알려주지 않는 레스토랑의 테이블, 정식 오픈 전에 체험하는 객실, 현지인만 아는 루트 — 이 모든 것이 진짜 럭셔리 여행을 만듭니다.',
    },
    body2: {
      en: 'Travel in your Pocket was born to bridge that gap. In an era when anyone can ask a chatbot for travel advice, an AI concierge powered by exclusive Virtuoso data and a global network of local editors exists only here.',
      kr: 'Travel in your Pocket은 그 간극을 메우기 위해 탄생했습니다. AI가 대중화된 시대에 누구나 챗봇에게 여행을 물어볼 수 있지만, Virtuoso 네트워크의 독점 데이터와 전 세계 로컬 에디터 네트워크를 탑재한 AI 컨시어지는 오직 여기에만 있습니다.',
    },
    pull: {
      en: '“Anyone can use a generic AI concierge. What we build is an AI crafted exclusively for you.”',
      kr: '"일반적인 AI 컨시어지는 누구나 쓸 수 있습니다. 우리가 만드는 건 오직 당신만을 위한 AI입니다."',
    },
    body3: {
      en: 'Every recommendation begins not from an algorithm alone, but from the knowledge of real travel editors and local partners. Where technology and human sensibility meet — that is Travel in your Pocket.',
      kr: '플랫폼의 모든 추천은 단순한 알고리즘이 아니라, 실제 여행 에디터와 로컬 파트너의 지식에서 출발합니다. 기술과 인간적 감각이 조화를 이루는 곳 — 그것이 Travel in your Pocket입니다.',
    },
  },
  difference: {
    eyebrow: { en: 'What Sets Us Apart', kr: '우리만의 차별점' },
    titleLeft: { en: "Why We're", kr: '우리가' },
    titleEm: { en: 'Different', kr: '다른 이유' },
    cards: [
      {
        title: {
          en: 'Proprietary Data–Driven AI',
          kr: '독점 데이터 기반 AI',
        },
        body: {
          en: 'Data from 2,200+ curated partner hotels and member booking history embedded directly into our AI — delivering recommendations no general-purpose AI can replicate.',
          kr: '2,200개 이상의 선별된 파트너 호텔 데이터와 멤버 예약 히스토리를 AI에 직접 탑재합니다. 일반 AI 도구로는 절대 받을 수 없는 추천을 경험하세요.',
        },
      },
      {
        title: {
          en: 'Full-Spectrum Partnerships',
          kr: '라이프스타일 전방위 파트너십',
        },
        body: {
          en: 'World-class luxury hotels, VIP airport services, fine dining, and lifestyle partnerships including The Hyundai, Mastercard, and Lotte Duty Free — every touchpoint of your journey in one platform.',
          kr: '전 세계 하이엔드 호텔과 VIP 공항 서비스, 파인 다이닝, 그리고 더현대·마스터카드·롯데 면세점 등 라이프스타일 파트너십까지. 여행의 모든 접점을 하나의 플랫폼에서.',
        },
      },
      {
        title: {
          en: 'Human Curation + AI Precision',
          kr: '인간 큐레이션 + AI 정밀도',
        },
        body: {
          en: 'Knowledge from global travel editors and local insiders woven into our AI. Algorithmic speed and genuine human sensibility, together.',
          kr: '전 세계 트래블 에디터와 로컬 인사이더의 지식이 AI에 반영됩니다. 알고리즘의 속도와 인간의 감각, 두 가지를 동시에.',
        },
      },
    ],
  },
  philosophy: {
    eyebrow: { en: 'Our Philosophy', kr: '우리의 철학' },
    quoteLine1: {
      en: 'The finest journeys begin not from a plan,',
      kr: '최고의 여행은 계획이 아니라',
    },
    quoteLine2: {
      en: 'but from someone who understands you',
      kr: '당신을',
    },
    quoteEm: { en: 'deeply', kr: '깊이 이해하는 누군가' },
    quoteTail: { en: '.', kr: '로부터 시작됩니다.' },
  },
  faq: {
    eyebrow: { en: 'FAQ', kr: 'FAQ' },
    titleLeft: { en: 'Frequently Asked', kr: '자주 묻는' },
    titleEm: { en: 'Questions', kr: '질문' },
    intro: {
      en: 'For any further questions, our concierge team is available 24/7 to assist you personally.',
      kr: '궁금하신 점이 있으시면 언제든지 컨시어지 팀에 문의해주세요. 24시간 응대해드립니다.',
    },
    items: [
      {
        q: {
          en: 'What is Travel in your Pocket?',
          kr: 'Travel in your Pocket은 어떤 서비스인가요?',
        },
        a: {
          en: 'An AI-powered luxury travel concierge platform embedding exclusive Virtuoso network data, member booking history, private aviation, fine dining, and VIP airport services — delivering hyper-personalized recommendations no standard AI can match.',
          kr: '2,200개 이상의 선별된 파트너 호텔 데이터, 멤버 예약 히스토리, 프라이빗 에비에이션, 파인 다이닝, VIP 공항 서비스를 탑재한 AI 럭셔리 트래블 컨시어지 플랫폼입니다.',
        },
      },
      {
        q: {
          en: 'Is Travel in your Pocket a Virtuoso member?',
          kr: 'Virtuoso 파트너 혜택을 받을 수 있나요?',
        },
        a: {
          en: 'Yes. We operate within the Virtuoso partnership network, giving members exclusive benefits — room upgrades, hotel credits, daily breakfast, flexible check-in/out, welcome amenities, and more — across 2,200+ curated luxury hotels worldwide.',
          kr: '네. Virtuoso 파트너십 네트워크를 기반으로 전 세계 2,200개 이상의 선별된 럭셔리 호텔에서 룸 업그레이드, 호텔 크레딧, 조식 제공, 유연한 체크인/아웃, 웰컴 어메니티 등 각 호텔에서만 받을 수 있는 독점 혜택을 제공합니다.',
        },
      },
      {
        q: {
          en: 'What does a membership include?',
          kr: '멤버십 혜택은 무엇인가요?',
        },
        a: {
          en: 'AI concierge access, a dedicated human travel specialist, 24/7 priority support, member-exclusive rates, room upgrades, hotel credits, daily breakfast, welcome amenities, custom itinerary creation, private aviation benefits, and VIP airport services. Benefits vary by partner hotel — our concierge will guide you to the best perks for each stay.',
          kr: 'AI 컨시어지 이용, 전담 트래블 스페셜리스트 배정, 24/7 우선 응대, 멤버 전용 호텔 요금, 룸 업그레이드, 호텔 크레딧, 조식 제공, 웰컴 어메니티, 맞춤 여행 일정 제작, 프라이빗 에비에이션 혜택, VIP 공항 서비스 등이 포함됩니다. 파트너 호텔별로 받을 수 있는 혜택이 다르며, 컨시어지가 최적의 혜택을 안내해드립니다.',
        },
      },
    ],
    contactCta: { en: 'Contact Us', kr: '컨시어지 문의' },
  },
  partners: {
    label: { en: 'Partners & Network', kr: '파트너 & 네트워크' },
    // Logo files don't exist yet — we render the brand names as a styled
    // fallback. Drop SVGs into /public/partners/ and swap to <Image>.
    names: [
      'Virtuoso',
      'IHG',
      'VistaJet',
      'NetJets',
      'The Hyundai',
      'Mastercard',
      'Lotte Duty Free',
    ],
  },
  cta: {
    eyebrow: { en: 'Membership', kr: '멤버십' },
    titleLine1: { en: 'Begin your journey,', kr: '당신만의 여행을' },
    titleEm: { en: 'today', kr: '지금 시작하세요' },
    sub: {
      en: 'AI concierge, dedicated travel specialists, and exclusive global partner benefits — all in one place.',
      kr: 'AI 컨시어지, 전담 트래블 스페셜리스트, 전 세계 독점 파트너 혜택을 한곳에서.',
    },
    button: { en: 'Begin your journey', kr: '여행을 시작하세요' },
  },
};

// Small wrapper that mirrors the existing site's bilingual pattern.
function L({ s, isEn }: { s: Bilingual; isEn: boolean }) {
  return <>{s[isEn ? 'en' : 'kr']}</>;
}

// Section-marker eyebrow ("— EYEBROW") used throughout the page.
function Eyebrow({
  s,
  isEn,
  tone = 'dark',
  centered = false,
}: {
  s: Bilingual;
  isEn: boolean;
  tone?: 'dark' | 'light';
  centered?: boolean;
}) {
  const color = tone === 'dark' ? 'text-gold' : 'text-gold/90';
  return (
    <div
      className={`flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.28em] ${color} ${centered ? 'justify-center' : ''}`}
    >
      <span className={`block h-px w-8 ${tone === 'dark' ? 'bg-gold' : 'bg-gold/90'}`} />
      <L s={s} isEn={isEn} />
    </div>
  );
}

// IntersectionObserver-driven fade-up. Lightweight client-only polish; the
// content is fully visible without JS, so it degrades gracefully.
function Reveal({
  children,
  delayMs = 0,
  className = '',
}: {
  children: React.ReactNode;
  delayMs?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true);
            obs.unobserve(e.target);
          }
        }
      },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delayMs}ms` }}
      className={`transition-[opacity,transform] duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} ${className}`}
    >
      {children}
    </div>
  );
}

export default function AboutPage() {
  const { lang } = useLanguage();
  const isEn = lang === 'en';
  const { status } = useSession();

  // Logged-in members go straight to the concierge to start a new trip;
  // visitors land on /register first. We don't add a callback param — once
  // they finish signup + onboarding the existing flow already routes them
  // into the app, and the About-page CTA's job ends there.
  const ctaHref = status === 'authenticated' ? '/concierge' : '/register';

  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <main className="bg-gray-light text-[#1A1A18]">
      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section
        className="relative flex min-h-[88vh] items-center overflow-hidden px-6 pb-20 pt-28 sm:px-10 lg:px-[100px]"
        style={{
          background: 'linear-gradient(160deg, #FAF9F7 0%, #F0EBE2 100%)',
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 70% 60% at 80% 30%, rgba(196,149,106,0.12) 0%, transparent 65%), radial-gradient(ellipse 50% 70% at 10% 90%, rgba(30,61,47,0.06) 0%, transparent 60%)',
          }}
        />
        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
          <div>
            <Eyebrow s={COPY.hero.eyebrow} isEn={isEn} />
            <h1 className="mt-6 font-primary text-[clamp(2.75rem,5.5vw,5rem)] font-normal leading-[1.08]">
              <L s={COPY.hero.titleLine1} isEn={isEn} />
              <br />
              <em className="italic text-green-dark">
                <L s={COPY.hero.titleLine2} isEn={isEn} />
              </em>
            </h1>
            <p className="mt-8 max-w-[460px] text-[15px] leading-[1.9] text-gray-text">
              <L s={COPY.hero.desc} isEn={isEn} />
            </p>
            <div className="mt-10">
              <PrimaryCta href={ctaHref} label={COPY.hero.cta} isEn={isEn} />
            </div>
          </div>

          <div className="flex flex-col">
            {COPY.stats.map((stat, i) => (
              <Reveal key={stat.num} delayMs={200 + i * 200} className="border-b border-black/10">
                <div className={`py-8 ${i === 0 ? 'border-t border-black/10' : ''}`}>
                  <div className="font-primary text-[5rem] leading-none text-green-dark">
                    {stat.num}
                  </div>
                  <div className="mt-2 text-[12px] uppercase tracking-[0.14em] text-gray-text">
                    <L s={stat.label} isEn={isEn} />
                  </div>
                  <div className="mt-2 text-[13px] leading-[1.7] text-gray-text/90">
                    <L s={stat.desc} isEn={isEn} />
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── STORY ─────────────────────────────────────────────────────────── */}
      <section className="bg-gray-light px-6 py-24 sm:px-10 lg:px-[100px]">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <Eyebrow s={COPY.story.eyebrow} isEn={isEn} />
            <h2 className="mt-4 font-primary text-[clamp(2rem,3.5vw,3rem)] font-normal leading-[1.15]">
              <L s={COPY.story.titleLeft} isEn={isEn} />{' '}
              <em className="italic text-green-dark">
                <L s={COPY.story.titleEm} isEn={isEn} />
              </em>
            </h2>
          </Reveal>

          <div className="mt-8 grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
            <Reveal delayMs={150}>
              <div className="space-y-5 text-[15px] leading-[2] text-gray-text">
                <p>
                  <L s={COPY.story.body1} isEn={isEn} />
                </p>
                <p>
                  <L s={COPY.story.body2} isEn={isEn} />
                </p>
              </div>
            </Reveal>

            <Reveal delayMs={300}>
              <blockquote className="my-2 border-y border-black/10 py-8 font-primary text-[1.6rem] italic leading-[1.5] text-[#1A1A18]">
                <L s={COPY.story.pull} isEn={isEn} />
              </blockquote>
              <p className="mt-6 text-[15px] leading-[2] text-gray-text">
                <L s={COPY.story.body3} isEn={isEn} />
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── DIFFERENCE (dark) ─────────────────────────────────────────────── */}
      <section className="bg-green-dark px-6 py-24 sm:px-10 lg:px-[100px]">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <Eyebrow s={COPY.difference.eyebrow} isEn={isEn} tone="light" />
            <h2 className="mt-4 font-primary text-[clamp(2rem,3.5vw,3rem)] font-normal leading-[1.15] text-white">
              <L s={COPY.difference.titleLeft} isEn={isEn} />{' '}
              <em className="italic text-gold">
                <L s={COPY.difference.titleEm} isEn={isEn} />
              </em>
            </h2>
          </Reveal>

          <Reveal delayMs={200}>
            <div className="mt-14 grid gap-[1px] bg-white/10 md:grid-cols-3">
              {COPY.difference.cards.map((card, i) => (
                <article
                  key={card.title.en}
                  className="group relative overflow-hidden bg-green-dark/85 p-10 transition-colors hover:bg-[#3A5240]"
                >
                  <div className="font-primary text-[3rem] italic leading-none text-gold/30">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <h3 className="mt-6 font-primary text-[1.35rem] font-normal leading-[1.3] text-white">
                    <L s={card.title} isEn={isEn} />
                  </h3>
                  <p className="mt-3 text-[13px] leading-[1.85] text-white/60">
                    <L s={card.body} isEn={isEn} />
                  </p>
                  <span
                    aria-hidden
                    className="absolute inset-x-0 bottom-0 h-[2px] origin-left scale-x-0 bg-gold transition-transform duration-300 group-hover:scale-x-100"
                  />
                </article>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── PHILOSOPHY ────────────────────────────────────────────────────── */}
      <section className="bg-[#F0EBE2] px-6 py-24 sm:px-10 lg:px-[100px]">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <Eyebrow s={COPY.philosophy.eyebrow} isEn={isEn} centered />
          </Reveal>
          <Reveal delayMs={200}>
            <blockquote className="relative mx-auto mt-10 max-w-2xl py-10 font-primary text-[clamp(1.6rem,3vw,2.5rem)] italic leading-[1.4] before:mx-auto before:mb-8 before:block before:h-px before:w-12 before:bg-gold after:mx-auto after:mt-8 after:block after:h-px after:w-12 after:bg-gold">
              <L s={COPY.philosophy.quoteLine1} isEn={isEn} />
              <br />
              <L s={COPY.philosophy.quoteLine2} isEn={isEn} />{' '}
              <em className="text-green-dark">
                <L s={COPY.philosophy.quoteEm} isEn={isEn} />
              </em>
              <L s={COPY.philosophy.quoteTail} isEn={isEn} />
            </blockquote>
          </Reveal>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <section className="bg-gray-light px-6 py-24 sm:px-10 lg:px-[100px]">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <Eyebrow s={COPY.faq.eyebrow} isEn={isEn} />
            <h2 className="mt-4 font-primary text-[clamp(2rem,3.5vw,3rem)] font-normal leading-[1.15]">
              <L s={COPY.faq.titleLeft} isEn={isEn} />{' '}
              <em className="italic text-green-dark">
                <L s={COPY.faq.titleEm} isEn={isEn} />
              </em>
            </h2>
          </Reveal>

          <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_1.6fr] lg:gap-20">
            <Reveal delayMs={100}>
              <div className="sticky top-32 text-[15px] leading-[1.9] text-gray-text">
                <p>
                  <L s={COPY.faq.intro} isEn={isEn} />
                </p>
                <Link
                  href="mailto:support@tip-ai.com"
                  className="mt-6 inline-flex h-11 items-center rounded-full border border-black/15 px-6 text-[13px] text-[#1A1A18] transition-colors hover:border-green-dark hover:text-green-dark"
                >
                  <L s={COPY.faq.contactCta} isEn={isEn} />
                </Link>
              </div>
            </Reveal>

            <Reveal delayMs={200}>
              <div className="flex flex-col" data-testid="about-faq">
                {COPY.faq.items.map((item, i) => {
                  const open = openFaq === i;
                  return (
                    <div
                      key={item.q.en}
                      className={`border-t border-black/10 ${i === COPY.faq.items.length - 1 ? 'border-b' : ''}`}
                    >
                      <button
                        type="button"
                        aria-expanded={open}
                        onClick={() => setOpenFaq(open ? null : i)}
                        className="flex w-full items-center justify-between gap-6 py-6 text-left font-primary text-[17px] text-[#1A1A18] transition-colors hover:text-green-dark"
                      >
                        <span>
                          <L s={item.q} isEn={isEn} />
                        </span>
                        <span
                          aria-hidden
                          className={`shrink-0 text-[20px] font-light text-gold transition-transform duration-300 ${open ? 'rotate-45' : ''}`}
                        >
                          +
                        </span>
                      </button>
                      <div
                        className={`grid overflow-hidden text-[14px] leading-[1.95] text-gray-text transition-[grid-template-rows,padding] duration-400 ease-out ${open ? 'grid-rows-[1fr] pb-6' : 'grid-rows-[0fr]'}`}
                      >
                        <div className="overflow-hidden">
                          <L s={item.a} isEn={isEn} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── PARTNERS ──────────────────────────────────────────────────────── */}
      <section className="bg-[#E8E0D4]/70 px-6 py-16 sm:px-10 lg:px-[100px]">
        <div className="mx-auto max-w-7xl text-center">
          <div className="text-[11px] uppercase tracking-[0.25em] text-gray-text">
            <L s={COPY.partners.label} isEn={isEn} />
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
            {COPY.partners.names.map((name) => (
              <span
                key={name}
                className="text-[12px] font-medium uppercase tracking-[0.15em] text-gray-text/70 transition-colors hover:text-gray-text"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA (dark) ────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-green-dark px-6 py-28 text-center sm:px-10 lg:px-[100px]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 60% 70% at 50% 50%, rgba(196,149,106,0.10) 0%, transparent 65%)',
          }}
        />
        <div className="relative mx-auto max-w-3xl">
          <Reveal>
            <Eyebrow s={COPY.cta.eyebrow} isEn={isEn} tone="light" centered />
          </Reveal>
          <Reveal delayMs={150}>
            <h2 className="mt-6 font-primary text-[clamp(2rem,3.5vw,3rem)] font-normal leading-[1.15] text-white">
              <L s={COPY.cta.titleLine1} isEn={isEn} />
              <br />
              <em className="italic text-gold">
                <L s={COPY.cta.titleEm} isEn={isEn} />
              </em>
            </h2>
          </Reveal>
          <Reveal delayMs={250}>
            <p className="mx-auto mt-8 max-w-xl text-[15px] leading-[1.8] text-white/55">
              <L s={COPY.cta.sub} isEn={isEn} />
            </p>
          </Reveal>
          <Reveal delayMs={350}>
            <div className="mt-10 flex justify-center">
              <PrimaryCta href={ctaHref} label={COPY.cta.button} isEn={isEn} tone="light" />
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
    </main>
  );
}

// The single auth-aware CTA used in both hero and closing sections.
// Authenticated members → /concierge (a new trip). Visitors → /register.
function PrimaryCta({
  href,
  label,
  isEn,
  tone = 'dark',
}: {
  href: string;
  label: Bilingual;
  isEn: boolean;
  tone?: 'dark' | 'light';
}) {
  // `tone="light"` is used on dark sections (white pill on green); `dark` is
  // the green-on-light default used in the hero.
  const base =
    'group inline-flex h-12 items-center gap-3 rounded-full px-7 text-[14px] font-medium tracking-[0.03em] transition-colors';
  const palette =
    tone === 'light'
      ? 'bg-white text-green-dark hover:bg-gray-light'
      : 'bg-green-dark text-white hover:bg-[#163427]';
  return (
    <Link href={href} className={`${base} ${palette}`} data-testid="about-primary-cta">
      <L s={label} isEn={isEn} />
      <span
        aria-hidden
        className="inline-block transition-transform duration-200 group-hover:translate-x-1"
      >
        →
      </span>
    </Link>
  );
}
