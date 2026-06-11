'use client';

import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';

export type Partner = { name: string; slug: string; logo: string };

// Curated luxury hotel-brand + travel-network partner logos.
// Single source of truth shared by the home page and the About page.
// Brand names are universal (never translated). Assets are static files
// under /public/partners/ — no runtime/API fetch.
export const partners: Partner[] = [
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

// Auto-scrolling partner-logo marquee. Shared by the home page and the About
// page so the partner brand set can never drift between them. The track holds
// the logo list twice; the -50% keyframe (globals.css) loops seamlessly. Hover
// pauses it; prefers-reduced-motion disables the animation entirely. Every logo
// renders at a uniform height (max-h-12) for consistent styling.
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
  );
}
