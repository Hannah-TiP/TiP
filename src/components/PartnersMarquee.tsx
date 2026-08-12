'use client';

import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';

// width/height are the natural pixel dimensions of the logo asset, so each
// <Image> carries its true aspect ratio instead of a one-size-fits-all box.
export type Partner = {
  name: string;
  slug: string;
  ext: 'jpg' | 'png' | 'svg';
  width: number;
  height: number;
};

// Curated luxury hotel-brand + travel-network partner logos.
// Single source of truth shared by the home page and the About page.
// Brand names are universal (never translated). Assets are static files
// under /public/partners/ — no runtime/API fetch.
export const partners: Partner[] = [
  { name: 'Aman', slug: 'aman', ext: 'jpg', width: 400, height: 400 },
  { name: 'Janu', slug: 'janu', ext: 'jpg', width: 1080, height: 1080 },
  {
    name: 'Four Seasons',
    slug: 'four-seasons',
    ext: 'jpg',
    width: 1600,
    height: 1600,
  },
  {
    name: 'Mandarin Oriental',
    slug: 'mandarin-oriental',
    ext: 'png',
    width: 820,
    height: 644,
  },
  {
    name: 'The Peninsula',
    slug: 'the-peninsula',
    ext: 'png',
    width: 820,
    height: 167,
  },
  { name: 'Rosewood', slug: 'rosewood', ext: 'png', width: 425, height: 425 },
  { name: 'Raffles', slug: 'raffles', ext: 'png', width: 820, height: 469 },
  {
    name: 'Shangri-La',
    slug: 'shangri-la',
    ext: 'png',
    width: 800,
    height: 84,
  },
  { name: 'St. Regis', slug: 'st-regis', ext: 'jpg', width: 400, height: 400 },
  {
    name: 'The Ritz-Carlton',
    slug: 'ritz-carlton',
    ext: 'jpg',
    width: 400,
    height: 400,
  },
  {
    name: 'The Ritz-Carlton Yacht Collection',
    slug: 'ritz-carlton-yacht-collection',
    ext: 'jpg',
    width: 400,
    height: 400,
  },
  {
    name: 'Bulgari Hotels & Resorts',
    slug: 'bulgari',
    ext: 'jpg',
    width: 623,
    height: 233,
  },
  {
    name: 'Cheval Blanc',
    slug: 'cheval-blanc',
    ext: 'jpg',
    width: 515,
    height: 325,
  },
  {
    name: 'Dorchester Collection',
    slug: 'dorchester-collection',
    ext: 'png',
    width: 366,
    height: 210,
  },
  {
    name: 'Oetker Collection',
    slug: 'oetker-collection',
    ext: 'png',
    width: 820,
    height: 252,
  },
  {
    name: 'Auberge Collection',
    slug: 'auberge-collection',
    ext: 'png',
    width: 820,
    height: 104,
  },
  {
    name: 'The Set Collection',
    slug: 'the-set-collection',
    ext: 'svg',
    width: 283.5,
    height: 283.5,
  },
  { name: 'Belmond', slug: 'belmond', ext: 'png', width: 380, height: 160 },
  {
    name: 'Six Senses',
    slug: 'six-senses',
    ext: 'png',
    width: 3140,
    height: 2480,
  },
  { name: 'Soneva', slug: 'soneva', ext: 'jpg', width: 400, height: 400 },
  { name: 'Singita', slug: 'singita', ext: 'jpg', width: 400, height: 400 },
  { name: 'Fairmont', slug: 'fairmont', ext: 'jpg', width: 400, height: 400 },
  {
    name: 'Upper House',
    slug: 'upper-house',
    ext: 'png',
    width: 352,
    height: 60,
  },
  {
    name: 'Hoshino Resorts',
    slug: 'hoshino-resorts',
    ext: 'jpg',
    width: 734,
    height: 138,
  },
  { name: 'Virtuoso', slug: 'virtuoso', ext: 'png', width: 820, height: 131 },
  { name: 'IATA', slug: 'iata', ext: 'png', width: 820, height: 526 },
  {
    name: 'Marriott Stars & Luminous',
    slug: 'marriott-stars-luminous',
    ext: 'jpg',
    width: 663,
    height: 136,
  },
  {
    name: 'IHG Destined',
    slug: 'ihg-destined',
    ext: 'jpg',
    width: 444,
    height: 219,
  },
  {
    name: 'Accor HERA Travel Advisor Program',
    slug: 'accor-hera',
    ext: 'jpg',
    width: 1897,
    height: 609,
  },
  {
    name: 'Jumeirah Passport to Luxury',
    slug: 'jumeirah-passport-to-luxury',
    ext: 'png',
    width: 768,
    height: 216,
  },
  {
    name: 'Switzerland Tourism',
    slug: 'switzerland-tourism',
    ext: 'png',
    width: 8992,
    height: 1255,
  },
  {
    name: 'Lotte Duty Free',
    slug: 'lotte-duty-free',
    ext: 'jpg',
    width: 2048,
    height: 2048,
  },
  {
    name: 'The Hyundai',
    slug: 'the-hyundai',
    ext: 'jpg',
    width: 828,
    height: 301,
  },
];

// Logos render at a uniform 108px; the width/height attrs are 2x that
// for crisp retina sourcing while preserving each logo's natural aspect ratio.
export const LOGO_DISPLAY_HEIGHT = 216;

export function logoDisplayWidth(partner: Partner): number {
  return Math.round((partner.width / partner.height) * LOGO_DISPLAY_HEIGHT);
}

// Auto-scrolling partner-logo marquee. Shared by the home page and the About
// page so the partner brand set can never drift between them. The track holds
// the logo list twice; the -50% keyframe (globals.css) loops seamlessly. Hover
// pauses it; prefers-reduced-motion disables the animation entirely. Every logo
// renders at the uniform 108px height in its natural aspect ratio (per-logo
// width/height attrs); max-w-full + object-contain cap ultra-wide wordmarks
// (e.g. Shangri-La, Switzerland Tourism) at the cell width without distortion.
export default function PartnersMarquee() {
  const { t } = useLanguage();

  return (
    <div
      className="marquee group relative overflow-hidden"
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
            className="flex h-36 w-[315px] flex-shrink-0 items-center justify-center px-[54px] md:w-[405px]"
          >
            <Image
              src={`/partners/${partner.slug}.${partner.ext}`}
              alt={partner.name}
              width={logoDisplayWidth(partner)}
              height={LOGO_DISPLAY_HEIGHT}
              loading="eager"
              className="h-[108px] w-auto max-w-full object-contain opacity-50 grayscale transition duration-300 hover:opacity-100 hover:grayscale-0"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
