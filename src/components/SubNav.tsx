'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import type { SubNavKey } from '@/lib/header-config';
import { useLanguage, type TranslationKeys } from '@/contexts/LanguageContext';

interface SubNavProps {
  activeTab: SubNavKey;
}

/** Maps each tab key to its href and i18n label key. */
const tabs: { label: SubNavKey; href: string; i18nKey: TranslationKeys }[] = [
  { label: 'Upcoming Travels', href: '/my-page', i18nKey: 'subnav.upcoming_travels' },
  { label: 'Shared With Me', href: '/my-page/shared-trips', i18nKey: 'subnav.shared_with_me' },
  { label: 'Travel History', href: '/my-page/travel-history', i18nKey: 'subnav.travel_history' },
  { label: 'Membership', href: '/my-page/membership', i18nKey: 'subnav.membership' },
  { label: 'Credits', href: '/my-page/credits', i18nKey: 'subnav.credits' },
  { label: 'Referrals', href: '/my-page/referrals', i18nKey: 'subnav.referrals' },
  { label: 'Wishlist', href: '/my-page/wishlist', i18nKey: 'subnav.wishlist' },
  { label: 'My Profile', href: '/my-page/my-profile', i18nKey: 'subnav.my_profile' },
];

export default function SubNav({ activeTab }: SubNavProps) {
  const { t } = useLanguage();
  const activeRef = useRef<HTMLAnchorElement>(null);

  // On mobile the tab row scrolls horizontally; make sure the active tab is
  // visible on mount (and whenever it changes) so users don't land on a row
  // that has scrolled the current tab off-screen.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [activeTab]);

  return (
    <nav
      className="flex items-center overflow-x-auto border-b border-gray-border bg-white px-4 md:px-10"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.label;
        return (
          <Link
            key={tab.label}
            ref={isActive ? activeRef : undefined}
            href={tab.href}
            className={`flex items-center whitespace-nowrap border-b-2 px-5 py-[14px] text-[14px] no-underline transition-colors ${
              isActive
                ? 'border-green-dark font-bold text-green-dark'
                : 'border-transparent font-medium text-[#999999] hover:text-green-dark'
            }`}
          >
            {t(tab.i18nKey)}
          </Link>
        );
      })}
    </nav>
  );
}
