'use client';

import Image from 'next/image';
import Link from 'next/link';
import { OPEN_COOKIE_SETTINGS_EVENT } from '@/components/CookieConsentBanner';

type FooterLink = {
  label: string;
  href: string;
  /** When true, dispatches a custom event instead of navigating. */
  event?: boolean;
};

// `href: '#'` marks a stub link; wire it up when the destination page lands.
const exploreLinks: FooterLink[] = [
  { label: 'Dream Hotels', href: '#' },
  { label: 'Insights', href: '#' },
  { label: 'Itinerary', href: '#' },
  { label: 'Concierge', href: '#' },
];
const companyLinks: FooterLink[] = [
  { label: 'About Us', href: '/about' },
  { label: 'Careers', href: '#' },
  { label: 'Press', href: '#' },
  { label: 'Blog', href: '#' },
];
const supportLinks: FooterLink[] = [
  { label: 'Help Center', href: '#' },
  { label: 'Contact Us', href: '#' },
  { label: 'Privacy Policy', href: '/privacy-policy' },
  { label: 'Terms of Service', href: '/terms-of-service' },
  { label: 'Cookie Settings', href: '#', event: true },
];

export default function Footer() {
  return (
    <footer
      style={{
        backgroundColor: '#214032',
        padding: '48px 100px',
        display: 'flex',
        flexDirection: 'column',
        gap: 40,
      }}
    >
      {/* Top row */}
      <div className="flex justify-between items-start">
        <Image
          src="/bible_TIP_logo_noir.svg"
          alt="TiP"
          width={120}
          height={40}
          style={{ height: 40, filter: 'brightness(0) invert(1)' }}
        />

        <div className="flex" style={{ gap: 80 }}>
          <FooterColumn title="Explore" items={exploreLinks} />
          <FooterColumn title="Company" items={companyLinks} />
          <FooterColumn title="Support" items={supportLinks} />
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
        <p style={{ margin: 0 }}>고객센터: support@tip-ai.com | 전화: 02-1234-5678</p>
      </div>

      {/* Copyright */}
      <div
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 12,
          color: 'rgba(255,255,255,0.3)',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          paddingTop: 24,
        }}
      >
        © 2026 TiP AI. Crafted for discerning travelers.
      </div>
    </footer>
  );
}

function FooterColumn({ title, items }: { title: string; items: FooterLink[] }) {
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
        {title}
      </span>
      {items.map((item) =>
        item.event ? (
          <button
            key={item.label}
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
            {item.label}
          </button>
        ) : (
          <Link
            key={item.label}
            href={item.href}
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 13,
              fontWeight: 400,
              color: 'rgba(255,255,255,0.4)',
              textDecoration: 'none',
            }}
          >
            {item.label}
          </Link>
        ),
      )}
    </div>
  );
}
