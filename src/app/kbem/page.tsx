'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Footer from '@/components/Footer';

// ── KB금융그룹 employee-benefits landing (/kbem) ──────────────────────────────
//
// Korean-only marketing page (matches /privacy-policy + /terms-of-service:
// no useLanguage/Bilingual wiring — the copy is fixed Korean). Restyled from
// the standalone mockup onto the app's design tokens; the global site Header
// (mounted in app/layout.tsx) and the shared <Footer /> replace the mockup's
// own nav + footer.
//
// Per the /privacy-policy precedent, all user-facing Korean copy lives in the
// `COPY` data object below and is rendered via {interpolation}. The i18n
// ESLint guard only flags raw JSX text children, so this keeps the page lint-
// clean while staying single-language by design (same as privacy/terms).

const COPY = {
  hero: {
    eyebrow: 'Travel in Your Pocket × KB금융그룹',
    titleLine1: '임직원을 위한',
    titleLine2: '럭셔리 여행,',
    titleEm: '지금 시작하세요.',
    desc: '전 세계 2,200개 이상의 럭셔리 파트너 호텔에서 KB금융그룹 임직원 전용 VIP 혜택을 누리세요. 아만, 포시즌스, 카펠라, 메리어트 등 최상위 호텔 이용 가능.',
    cta: '지금 가입하기',
    voucherWelcomeLabel: '가입 즉시 지급',
    voucherWelcomeAmount: '$50',
    voucherWelcomeCond: '웰컴 바우처 (미화 기준) — 회사 이메일(@kbfg.com) 가입 시 즉시 지급',
    voucherPremiumLabel: '200만원 이상 예약 시 (1회 한정)',
    voucherPremiumAmount: '$80',
    voucherPremiumCond: '프리미엄 바우처 (미화 기준) — 단일 예약 200만원 이상 결제 시 자동 지급',
    launch: '2026년 7월 1일 오픈 예정',
  },
  benefits: {
    eyebrow: 'VIP Membership',
    titleLine1: '임직원 전용',
    titleEm: '멤버십 혜택',
    cards: [
      {
        icon: '☕',
        title: '조식 2인 포함',
        desc: 'Daily Breakfast for Two. 파트너 호텔 전 객실 투숙 시 매일 조식 2인분 제공.',
      },
      {
        icon: '🛏',
        title: '얼리 체크인 / 레이트 체크아웃 우선 배정',
        desc: '가능 시 임직원 우선 배정. 오후 4시 레이트 체크아웃 · 얼리 체크인 모두 적용.',
      },
      {
        icon: '⭐',
        title: '체크인 시 VIP 리스팅',
        desc: '호텔 체크인 시 VIP 고객으로 등록. 프런트 데스크에서 특별 예우를 받으실 수 있습니다.',
      },
      {
        icon: '⬆',
        title: '객실 업그레이드 우선 배정',
        desc: '업그레이드 가능 시 임직원 우선 배정. 상위 카테고리 객실을 먼저 배정받으세요.',
      },
      {
        icon: '🎁',
        title: '웰컴 어메니티',
        desc: '체크인 시 웰컴 어메니티 제공. 호텔별 다양한 환영 선물 준비.',
      },
      {
        icon: '💳',
        title: '임직원 전용 특가',
        desc: '파트너 호텔 전 객실에 임직원 전용 특가 자동 적용. 일반 예약 채널 대비 우대 요금.',
      },
      {
        icon: '🎂',
        title: '특별한 날 어메니티',
        desc: '생일 등 특별한 날 사전 요청 시 과일·디저트·카드 등 맞춤 어메니티 제공.',
      },
    ],
  },
  steps: {
    eyebrow: 'How It Works',
    titleEm: '4단계',
    titleTail: '로 시작하세요',
    siteLink: 'travelinyourpocket.com',
    items: [
      {
        num: 'Step 01',
        title: '가입',
        // Step 1 carries an in-app link to the site root; rendered specially.
        body: ' 접속 후 회사 이메일(@kbfg.com)로 가입',
        hasSiteLink: true,
      },
      {
        num: 'Step 02',
        title: '바우처 즉시 지급',
        body: '가입 완료 후 $50 웰컴 바우처 자동 지급',
        hasSiteLink: false,
      },
      {
        num: 'Step 03',
        title: '예약 요청 & 확정',
        body: '파트너 호텔 선택 후 예약 요청. 상담 또는 바로 확정 결제 — 할인 크레딧 및 VIP 혜택 자동 적용',
        hasSiteLink: false,
      },
      {
        num: 'Step 04',
        title: '투숙 & 추가 바우처',
        body: '혜택 받으며 투숙. 단일 예약 200만원 이상 시 $80 바우처 추가 지급',
        hasSiteLink: false,
      },
    ],
  },
  hotels: {
    eyebrow: 'Partner Hotels',
    titleLine1: '파트너 ',
    titleEm: '호텔',
    colRegion: '지역',
    colExamples: '파트너 호텔 예시',
    rows: [
      {
        region: '한국',
        examples:
          '시그니엘 서울, 파크 하얏트 서울, 콘래드 서울, 페어몬트 앰배서더 서울, 조선 팰리스, 더 신라 서울, 파크 하얏트 부산, JW 메리어트 제주 등',
      },
      {
        region: '일본',
        examples:
          '아만 도쿄, 아만 교토, 불가리 호텔 도쿄, 콘래드 도쿄, 페어몬트 도쿄, 포시즌스 교토, 카펠라 교토, 콘래드 오사카 등',
      },
      {
        region: '파리',
        examples: '르 브리스톨 파리 등 — 아만, 포시즌스, 메리어트 계열 포함 (추가 예정)',
      },
      {
        region: '글로벌',
        examples:
          '카펠라 호텔, 캠핀스키 호텔 — 아야나 리조트, 발리·자카르타 등 주요 도시 이용 가능',
      },
    ],
    note1:
      '* 파트너 호텔은 지속적으로 확대 중입니다. travelinyourpocket.com에 등록된 모든 호텔에서 VIP 혜택 이용 가능.',
    note2:
      '** 카펠라 호텔, 캠핀스키 호텔, 르 브리스톨 파리 포함 글로벌 파트너 호텔에서도 임직원 전용 혜택 적용.',
    listCta: '전체 호텔 목록 보기 →',
  },
  honeymoon: {
    eyebrow: 'Honeymoon Package',
    titleLine1: '허니문 ',
    titleEm: '패키지',
    tag: '결혼 예정 임직원 전용',
    title: '허니문 패키지',
    desc1: '결혼 예정 임직원을 위한 파트너 호텔 허니문 특가 패키지.',
    desc2: '전담 컨시어지를 통해 특별한 첫 여행을 준비하세요.',
  },
  family: {
    eyebrow: 'Family Package',
    titleLine1: '패밀리 ',
    titleEm: '패키지',
    tag: '가족 여행 전용',
    title: '패밀리 패키지',
    desc1: '임직원 가족을 위한 파트너 호텔 패밀리 특가 패키지.',
    desc2: '소중한 가족과 함께하는 특별한 여행을 전담 컨시어지가 준비해 드립니다.',
    bullets: [
      '• 패밀리 룸 / 스위트 임직원 우선 배정',
      '• 조식 가족 전원 포함',
      '• 어린이 어메니티 및 웰컴 서비스',
      '• 패밀리 전용 특가 요금 적용',
    ],
  },
  contact: {
    phone: '📞 고객센터 문의: 02-6013-7775',
    email: '✉ travelmate@travelinyourpocket.com',
  },
  cta: {
    eyebrow: 'KB금융그룹 임직원 전용',
    titleLine1: '지금 가입하고',
    titleEm: '$50 웰컴 바우처',
    titleTail: '를 받으세요.',
    sub1: '회사 이메일(@kbfg.com)로 가입 즉시 웰컴 바우처 지급.',
    sub2: '별도 앱 설치 없이 웹에서 바로 이용 가능합니다.',
    button: '지금 시작하기',
  },
};

// Section-marker eyebrow ("— EYEBROW"), lifted from about/page.tsx.
function Eyebrow({ label, centered = false }: { label: string; centered?: boolean }) {
  return (
    <div
      className={`flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.28em] text-gold ${
        centered ? 'justify-center' : ''
      }`}
    >
      <span className="block h-px w-8 bg-gold" />
      {label}
    </div>
  );
}

// IntersectionObserver-driven fade-up (lifted from about/page.tsx). Content
// is fully visible without JS, so it degrades gracefully.
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
      className={`transition-[opacity,transform] duration-700 ease-out ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
      } ${className}`}
    >
      {children}
    </div>
  );
}

export default function KbEmployeePage() {
  return (
    <main className="bg-gray-light text-[#1A1A18]">
      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="grid gap-px bg-black/10 md:grid-cols-2">
        <div className="flex flex-col justify-center bg-gray-light px-6 py-14 sm:px-12 md:py-20">
          <Eyebrow label={COPY.hero.eyebrow} />
          <h1 className="mt-6 font-primary text-[clamp(2rem,5vw,2.75rem)] font-normal leading-[1.2]">
            {COPY.hero.titleLine1}
            <br />
            {COPY.hero.titleLine2}
            <br />
            <em className="italic text-green-dark">{COPY.hero.titleEm}</em>
          </h1>
          <p className="mt-6 max-w-[460px] text-[14px] leading-[1.9] text-gray-text">
            {COPY.hero.desc}
          </p>
          <div className="mt-9">
            <Link
              href="/register"
              data-testid="kbem-hero-cta"
              className="inline-flex w-fit items-center bg-gold px-8 py-3.5 text-[12px] font-medium uppercase tracking-[0.16em] text-white transition-opacity hover:opacity-85"
            >
              {COPY.hero.cta}
            </Link>
          </div>
        </div>

        <div className="flex flex-col justify-center bg-[#F0EBE2] px-6 py-12 sm:px-12">
          <div className="flex flex-col gap-4">
            <div className="border border-black/10 bg-white p-7">
              <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-gray-text">
                {COPY.hero.voucherWelcomeLabel}
              </div>
              <div className="mt-2.5 font-primary text-[34px] font-medium text-green-dark">
                {COPY.hero.voucherWelcomeAmount}
              </div>
              <div className="mt-1.5 text-[12px] font-light text-gray-text">
                {COPY.hero.voucherWelcomeCond}
              </div>
            </div>
            <div className="border border-black/10 bg-white p-7">
              <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-gray-text">
                {COPY.hero.voucherPremiumLabel}
              </div>
              <div className="mt-2.5 font-primary text-[34px] font-medium text-green-dark">
                {COPY.hero.voucherPremiumAmount}
              </div>
              <div className="mt-1.5 text-[12px] font-light text-gray-text">
                {COPY.hero.voucherPremiumCond}
              </div>
            </div>
          </div>
          <div className="mt-5 text-center text-[11px] tracking-[0.08em] text-gray-text">
            {COPY.hero.launch}
          </div>
        </div>
      </section>

      {/* ── VIP MEMBERSHIP BENEFITS ───────────────────────────────────────── */}
      <section className="border-t border-black/10 px-6 py-16 sm:px-10 md:py-20 lg:px-[100px]">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <Eyebrow label={COPY.benefits.eyebrow} />
            <h2 className="mt-4 font-primary text-[clamp(1.75rem,3.5vw,2rem)] font-normal leading-[1.25]">
              {COPY.benefits.titleLine1}
              <br />
              <em className="italic text-green-dark">{COPY.benefits.titleEm}</em>
            </h2>
          </Reveal>

          <Reveal delayMs={150}>
            <div className="mt-12 grid gap-px bg-black/10 md:grid-cols-3">
              {COPY.benefits.cards.map((b) => (
                <article key={b.title} className="bg-gray-light p-8">
                  <div className="text-[18px]">{b.icon}</div>
                  <h3 className="mt-4 font-primary text-[16px] font-normal leading-[1.3]">
                    {b.title}
                  </h3>
                  <p className="mt-2.5 text-[12px] font-light leading-[1.7] text-gray-text">
                    {b.desc}
                  </p>
                </article>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section className="border-t border-black/10 px-6 py-16 sm:px-10 md:py-20 lg:px-[100px]">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <Eyebrow label={COPY.steps.eyebrow} />
            <h2 className="mt-4 font-primary text-[clamp(1.75rem,3.5vw,2rem)] font-normal leading-[1.25]">
              <em className="italic text-green-dark">{COPY.steps.titleEm}</em>
              {COPY.steps.titleTail}
            </h2>
          </Reveal>

          <Reveal delayMs={150}>
            <div className="mt-12 grid gap-px bg-black/10 sm:grid-cols-2 lg:grid-cols-4">
              {COPY.steps.items.map((s) => (
                <div key={s.num} className="bg-gray-light p-7">
                  <span className="block font-primary text-[12px] italic text-gold">{s.num}</span>
                  <div className="mt-3.5 text-[13px] font-medium">{s.title}</div>
                  <div className="mt-2 text-[12px] font-light leading-[1.7] text-gray-text">
                    {s.hasSiteLink && (
                      <Link href="/" className="text-green-dark underline underline-offset-2">
                        {COPY.steps.siteLink}
                      </Link>
                    )}
                    {s.body}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── PARTNER HOTELS ────────────────────────────────────────────────── */}
      <section className="border-t border-black/10 bg-[#F0EBE2]/60 px-6 py-16 sm:px-10 md:py-20 lg:px-[100px]">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <Eyebrow label={COPY.hotels.eyebrow} />
            <h2 className="mt-4 font-primary text-[clamp(1.75rem,3.5vw,2rem)] font-normal leading-[1.25]">
              {COPY.hotels.titleLine1}
              <em className="italic text-green-dark">{COPY.hotels.titleEm}</em>
            </h2>
          </Reveal>

          <Reveal delayMs={150}>
            <table className="mt-10 w-full border-collapse text-[13px]">
              <thead>
                <tr className="border-b-2 border-green-dark">
                  <th className="w-[88px] py-3 pr-4 text-left text-[10px] font-normal uppercase tracking-[0.2em] text-gray-text">
                    {COPY.hotels.colRegion}
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-normal uppercase tracking-[0.2em] text-gray-text">
                    {COPY.hotels.colExamples}
                  </th>
                </tr>
              </thead>
              <tbody>
                {COPY.hotels.rows.map((row) => (
                  <tr key={row.region} className="border-b border-black/10 last:border-b-0">
                    <td className="py-4 pr-4 align-top text-[12px] font-medium tracking-[0.02em] text-green-dark">
                      {row.region}
                    </td>
                    <td className="px-4 py-4 align-top font-light leading-[1.7] text-gray-text">
                      {row.examples}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p className="mt-5 text-[11px] font-light leading-[1.7] text-gray-text">
              {COPY.hotels.note1}
              <br />
              {COPY.hotels.note2}
            </p>

            <Link
              href="/dream-hotels"
              data-testid="kbem-hotels-cta"
              className="mt-6 inline-block text-[11px] font-medium uppercase tracking-[0.16em] text-green-dark underline underline-offset-4"
            >
              {COPY.hotels.listCta}
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ── HONEYMOON PACKAGE ─────────────────────────────────────────────── */}
      <section className="border-t border-black/10 px-6 py-16 sm:px-10 md:py-20 lg:px-[100px]">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <Eyebrow label={COPY.honeymoon.eyebrow} />
            <h2 className="mt-4 font-primary text-[clamp(1.75rem,3.5vw,2rem)] font-normal leading-[1.25]">
              {COPY.honeymoon.titleLine1}
              <em className="italic text-green-dark">{COPY.honeymoon.titleEm}</em>
            </h2>
          </Reveal>

          <Reveal delayMs={150}>
            <div className="mt-10 border border-black/10 bg-gray-light p-8 sm:p-10">
              <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-gray-text">
                {COPY.honeymoon.tag}
              </div>
              <div className="mt-3 font-primary text-[18px] text-green-dark">
                {COPY.honeymoon.title}
              </div>
              <p className="mt-2.5 text-[12.5px] font-light leading-[1.75] text-gray-text">
                {COPY.honeymoon.desc1}
                <br />
                {COPY.honeymoon.desc2}
              </p>
              <p className="mt-4 text-[12.5px] font-light leading-[1.9] text-gray-text">
                {COPY.contact.phone}
                <br />
                {COPY.contact.email}
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FAMILY PACKAGE ────────────────────────────────────────────────── */}
      <section className="border-t border-black/10 bg-[#F0EBE2]/60 px-6 py-16 sm:px-10 md:py-20 lg:px-[100px]">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <Eyebrow label={COPY.family.eyebrow} />
            <h2 className="mt-4 font-primary text-[clamp(1.75rem,3.5vw,2rem)] font-normal leading-[1.25]">
              {COPY.family.titleLine1}
              <em className="italic text-green-dark">{COPY.family.titleEm}</em>
            </h2>
          </Reveal>

          <Reveal delayMs={150}>
            <div className="mt-10 border border-black/10 bg-gray-light p-8 sm:p-10">
              <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-gray-text">
                {COPY.family.tag}
              </div>
              <div className="mt-3 font-primary text-[18px] text-green-dark">
                {COPY.family.title}
              </div>
              <p className="mt-2.5 text-[12.5px] font-light leading-[1.75] text-gray-text">
                {COPY.family.desc1}
                <br />
                {COPY.family.desc2}
              </p>
              <ul className="mt-4 space-y-1 text-[12.5px] font-light leading-[1.7] text-gray-text">
                {COPY.family.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
              <p className="mt-4 text-[12.5px] font-light leading-[1.9] text-gray-text">
                {COPY.contact.phone}
                <br />
                {COPY.contact.email}
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── CTA BANNER (dark) ─────────────────────────────────────────────── */}
      <section className="bg-green-dark px-6 py-16 text-center sm:px-10 md:py-20 lg:px-[100px]">
        <div className="mx-auto max-w-2xl">
          <Reveal>
            <Eyebrow label={COPY.cta.eyebrow} centered />
          </Reveal>
          <Reveal delayMs={150}>
            <h2 className="mt-6 font-primary text-[clamp(1.75rem,3.5vw,2.125rem)] font-normal leading-[1.3] text-white">
              {COPY.cta.titleLine1}
              <br />
              <em className="italic text-gold">{COPY.cta.titleEm}</em>
              {COPY.cta.titleTail}
            </h2>
          </Reveal>
          <Reveal delayMs={250}>
            <p className="mx-auto mt-6 max-w-xl text-[13px] font-light leading-[1.8] text-white/60">
              {COPY.cta.sub1}
              <br />
              {COPY.cta.sub2}
            </p>
          </Reveal>
          <Reveal delayMs={350}>
            <div className="mt-9 flex justify-center">
              <Link
                href="/register"
                data-testid="kbem-cta-banner"
                className="inline-flex items-center bg-white px-10 py-3.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-green-dark transition-opacity hover:opacity-85"
              >
                {COPY.cta.button}
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
    </main>
  );
}
