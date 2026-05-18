'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useLanguage } from '@/contexts/LanguageContext';
import SubNav from '@/components/SubNav';
import { resolveHeaderConfig, type NavKey } from '@/lib/header-config';

const navLinks: { key: NavKey; label: string; href: string }[] = [
  { key: 'dream-hotels', label: 'DREAM HOTELS', href: '/dream-hotels' },
  { key: 'more-dreams', label: 'MORE DREAMS', href: '/more-dreams' },
  { key: 'insights', label: 'INSIGHTS', href: '/insights' },
  { key: 'concierge', label: 'CONCIERGE', href: '/concierge' },
];

/**
 * The single site header. Mounted once in the root layout, inside the
 * Session/Language providers. Variant, active nav link and SubNav are all
 * derived from the pathname via resolveHeaderConfig — no page passes props.
 */
export default function Header() {
  const pathname = usePathname() || '/';
  const config = resolveHeaderConfig(pathname);
  const { data: session } = useSession();
  const isAuthenticated = !!session;
  const { lang, setLang, t } = useLanguage();

  if (config.variant === 'none') return null;

  const isOverlay = config.variant === 'overlay';

  // Overlay variant: transparent bar that floats over the hero (the hero
  // section is the positioning context — page renders no extra top padding).
  // App variant: standard light bar in normal document flow.
  const headerClass = isOverlay
    ? 'absolute inset-x-0 top-0 z-20 flex h-[64px] items-center justify-between bg-transparent px-[60px]'
    : 'flex h-14 items-center justify-between border-b border-gray-border bg-white px-10';

  const logoStyle = isOverlay ? { filter: 'brightness(0) invert(1)' } : undefined;

  const navItemClass = (active: boolean) =>
    isOverlay
      ? `text-[11px] tracking-[2px] transition-colors ${
          active ? 'font-semibold text-white' : 'font-medium text-white/70 hover:text-white'
        }`
      : `text-[11px] font-medium tracking-[2px] transition-colors ${
          active ? 'text-green-dark' : 'text-green-dark/50 hover:text-green-dark'
        }`;

  return (
    <>
      <header className={headerClass}>
        <Link href="/">
          <Image
            src="/bible_TIP_profil_400x400px.svg"
            alt="TiP"
            width={36}
            height={36}
            className="h-9"
            style={logoStyle}
          />
        </Link>

        <nav className="flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              className={navItemClass(config.activeNav === link.key)}
            >
              {link.label}
            </Link>
          ))}

          <button
            onClick={() => setLang(lang === 'en' ? 'kr' : 'en')}
            className={navItemClass(false)}
          >
            {t('nav.language_toggle')}
          </button>

          {isAuthenticated ? (
            <>
              <Link href="/my-page" className={navItemClass(config.activeNav === 'my-page')}>
                MY PAGE
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className={
                  isOverlay
                    ? 'rounded-full border border-white/30 px-5 py-2 text-[11px] font-medium tracking-[1px] text-white transition-colors hover:bg-white/10'
                    : 'text-[11px] font-medium tracking-[2px] text-green-dark/50 transition-colors hover:text-green-dark'
                }
              >
                LOGOUT
              </button>
            </>
          ) : (
            <Link
              href="/sign-in"
              className={
                isOverlay
                  ? 'rounded-full border border-white/30 px-5 py-2 text-[11px] font-medium tracking-[1px] text-white transition-colors hover:bg-white/10'
                  : 'rounded-full border border-green-dark px-5 py-2 text-[11px] font-medium tracking-[2px] text-green-dark transition-colors hover:bg-green-dark hover:text-white'
              }
            >
              SIGN IN
            </Link>
          )}
        </nav>
      </header>

      {config.subNav && <SubNav activeTab={config.subNav.active} />}
    </>
  );
}
