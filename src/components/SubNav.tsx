'use client';

import Link from 'next/link';
import type { SubNavKey } from '@/lib/header-config';

interface SubNavProps {
  activeTab: SubNavKey;
}

const tabs: { label: SubNavKey; href: string }[] = [
  { label: 'Upcoming Travels', href: '/my-page' },
  { label: 'Travel History', href: '/my-page/travel-history' },
  { label: 'Membership', href: '/my-page/membership' },
  { label: 'Credits', href: '/my-page/credits' },
  { label: 'Referrals', href: '/my-page/referrals' },
  { label: 'Wishlist', href: '/my-page/wishlist' },
  { label: 'My Profile', href: '/my-page/my-profile' },
];

export default function SubNav({ activeTab }: SubNavProps) {
  return (
    <nav className="flex items-center border-b border-gray-border bg-white px-10">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.label;
        return (
          <Link
            key={tab.label}
            href={tab.href}
            className={`flex items-center whitespace-nowrap border-b-2 px-5 py-[14px] text-[14px] no-underline transition-colors ${
              isActive
                ? 'border-green-dark font-bold text-green-dark'
                : 'border-transparent font-medium text-[#999999] hover:text-green-dark'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
