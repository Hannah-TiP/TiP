'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

interface TopBarProps {
  activeLink: string;
}

const navLinks = [
  { label: 'DREAM HOTELS', href: '/dream-hotels' },
  { label: 'MORE DREAMS', href: '/more-dreams' },
  { label: 'INSIGHTS', href: '/insights' },
  { label: 'CONCIERGE', href: '/concierge' },
];

export default function TopBar({ activeLink }: TopBarProps) {
  const { data: session } = useSession();
  const isAuthenticated = !!session;

  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-border bg-white px-10">
      <Link href="/">
        <img src="/bible_TIP_profil_400x400px.svg" alt="TiP" className="h-9" />
      </Link>

      <nav className="flex items-center gap-8">
        {navLinks.map((link) => {
          const isActive = activeLink === link.label ||
            (activeLink === 'Dream Hotels' && link.label === 'DREAM HOTELS') ||
            (activeLink === 'More Dreams' && link.label === 'MORE DREAMS') ||
            (activeLink === 'Insights' && link.label === 'INSIGHTS') ||
            (activeLink === 'Concierge' && link.label === 'CONCIERGE');
          return (
            <Link
              key={link.label}
              href={link.href}
              className={`text-[11px] font-medium tracking-[2px] transition-colors ${
                isActive
                  ? 'text-green-dark'
                  : 'text-green-dark/50 hover:text-green-dark'
              }`}
            >
              {link.label}
            </Link>
          );
        })}

        {isAuthenticated ? (
          <>
            <Link
              href="/my-page"
              className={`text-[11px] font-medium tracking-[2px] transition-colors ${
                activeLink === 'My Page' || activeLink === 'MY PAGE'
                  ? 'text-green-dark'
                  : 'text-green-dark/50 hover:text-green-dark'
              }`}
            >
              MY PAGE
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="text-[11px] font-medium tracking-[2px] text-green-dark/50 hover:text-green-dark transition-colors"
            >
              LOGOUT
            </button>
          </>
        ) : (
          <Link
            href="/sign-in"
            className="rounded-full border border-green-dark px-5 py-2 text-[11px] font-medium tracking-[2px] text-green-dark hover:bg-green-dark hover:text-white transition-colors"
          >
            SIGN IN
          </Link>
        )}
      </nav>
    </header>
  );
}
