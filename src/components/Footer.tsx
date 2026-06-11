'use client';

import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { OPEN_COOKIE_SETTINGS_EVENT } from '@/components/CookieConsentBanner';
import { useLanguage } from '@/contexts/LanguageContext';

type TranslationKey = Parameters<ReturnType<typeof useLanguage>['t']>[0];

type FooterLink = {
  labelKey: TranslationKey;
  href: string;
  /** When true, dispatches a custom event instead of navigating. */
  event?: boolean;
};

type SocialLink = {
  aria: TranslationKey;
  href: string;
  icon: ReactNode;
};

// `href: '#'` marks a stub link; wire it up when the destination page lands.
const exploreLinks: FooterLink[] = [
  { labelKey: 'footer.link_dream_hotels', href: '/dream-hotels' },
  { labelKey: 'footer.link_itinerary', href: '#' },
  { labelKey: 'footer.link_concierge', href: '/concierge' },
];
const companyLinks: FooterLink[] = [
  { labelKey: 'footer.link_about_us', href: '/about' },
  { labelKey: 'footer.link_careers', href: '#' },
  { labelKey: 'footer.link_press', href: '#' },
  { labelKey: 'footer.link_blog', href: '#' },
];
const socialLinks: SocialLink[] = [
  {
    aria: 'footer.instagram_aria',
    href: 'https://instagram.com/travelinyourpocket_official',
    icon: (
      <svg
        width={18}
        height={18}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x={2} y={2} width={20} height={20} rx={5} ry={5} />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1={17.5} y1={6.5} x2={17.51} y2={6.5} />
      </svg>
    ),
  },
];

const supportLinks: FooterLink[] = [
  { labelKey: 'footer.link_help_center', href: '#' },
  { labelKey: 'footer.link_contact_us', href: '#' },
  { labelKey: 'footer.link_privacy_policy', href: '/privacy-policy' },
  { labelKey: 'footer.link_terms_of_service', href: '/terms-of-service' },
  { labelKey: 'footer.link_cookie_settings', href: '#', event: true },
];

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="flex flex-col gap-10 bg-green-footer px-6 py-12 md:px-[100px]">
      {/* Top row — wraps on narrow viewports so the link columns never force
          horizontal page scroll. */}
      <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-8">
        <Image
          src="/bible_TIP_logo_noir.svg"
          alt={t('footer.logo_alt')}
          width={120}
          height={40}
          style={{ height: 40, filter: 'brightness(0) invert(1)' }}
        />

        <div className="flex flex-wrap gap-x-12 gap-y-8 md:gap-x-20">
          <FooterColumn titleKey="footer.col_explore" items={exploreLinks} />
          <FooterColumn titleKey="footer.col_company" items={companyLinks} />
          <FooterColumn titleKey="footer.col_support" items={supportLinks} />
        </div>
      </div>

      {/* Info row */}
      <div
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 12,
          color: 'rgba(255,255,255,0.4)',
          lineHeight: 1.8,
          borderTop: '1px solid rgba(255,255,255,0.1)',
          paddingTop: 24,
        }}
      >
        <p style={{ margin: 0 }}>
          상호명: 주식회사 티아이피에이아이 | 대표: 홍길동 | 사업자등록번호: 123-45-67890
        </p>
        <p style={{ margin: 0 }}>
          주소: 서울특별시 강남구 테헤란로 123, 4층 | 통신판매업신고: 제2026-서울강남-00001호
        </p>
        {/* eslint-disable-next-line i18n/no-literal-string -- fixed KR business-registration data, identical in both locales */}
        <p style={{ margin: 0 }}>고객센터: support@tip-ai.com | 전화: 02-1234-5678</p>
      </div>

      {/* Copyright + social icons */}
      <div
        className="flex flex-wrap items-center justify-between gap-4"
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 12,
          color: 'rgba(255,255,255,0.3)',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          paddingTop: 24,
        }}
      >
        <span>{t('footer.copyright')}</span>
        <div className="flex items-center gap-4">
          {socialLinks.map((link) => (
            <a
              key={link.aria}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t(link.aria)}
              className="text-white/40 transition-colors hover:text-white/70"
            >
              {link.icon}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ titleKey, items }: { titleKey: TranslationKey; items: FooterLink[] }) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col" style={{ gap: 12 }}>
      <span
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 13,
          fontWeight: 600,
          color: 'rgba(255,255,255,0.66)',
        }}
      >
        {t(titleKey)}
      </span>
      {items.map((item) =>
        item.event ? (
          <button
            key={item.labelKey}
            type="button"
            onClick={() => window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT))}
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 13,
              fontWeight: 400,
              color: 'rgba(255,255,255,0.4)',
              textDecoration: 'none',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            {t(item.labelKey)}
          </button>
        ) : (
          <Link
            key={item.labelKey}
            href={item.href}
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 13,
              fontWeight: 400,
              color: 'rgba(255,255,255,0.4)',
              textDecoration: 'none',
            }}
          >
            {t(item.labelKey)}
          </Link>
        ),
      )}
    </div>
  );
}
