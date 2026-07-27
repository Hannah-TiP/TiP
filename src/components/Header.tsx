'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Lang } from '@/contexts/LanguageContext';
import SubNav from '@/components/SubNav';
import MobileNav from '@/components/MobileNav';
import { resolveHeaderConfig } from '@/lib/header-config';
import { navLinks } from '@/lib/nav-links';
import { applyLanguageToggle } from '@/lib/persist-language';

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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleToggleLanguage = () => {
    const next: Lang = lang === 'en' ? 'kr' : 'en';
    applyLanguageToggle(next, setLang, isAuthenticated);
  };

  if (config.variant === 'none') return null;

  const isOverlay = config.variant === 'overlay';

  // Overlay variant: transparent bar that floats over the hero (the hero
  // section is the positioning context — page renders no extra top padding).
  // App variant: standard light bar in normal document flow.
  const headerClass = isOverlay
    ? 'absolute inset-x-0 top-0 z-20 flex h-[64px] items-center justify-between bg-transparent px-4 md:px-10 lg:px-[60px]'
    : 'flex h-14 items-center justify-between border-b border-gray-border bg-white px-4 md:px-10';

  const logoStyle = isOverlay ? { filter: 'brightness(0) invert(1)' } : undefined;

  const navItemClass = (active: boolean) =>
    isOverlay
      ? `whitespace-nowrap text-[11px] tracking-[2px] transition-colors ${
          active ? 'font-semibold text-white' : 'font-medium text-white/70 hover:text-white'
        }`
      : `whitespace-nowrap text-[11px] font-medium tracking-[2px] transition-colors ${
          active ? 'text-green-dark' : 'text-green-dark/50 hover:text-green-dark'
        }`;

  // Hamburger glyph color tracks the variant (white over the hero, dark on the
  // light app bar). The drawer itself is always a solid light overlay.
  const hamburgerClass = `flex h-11 w-11 items-center justify-center md:hidden ${
    isOverlay ? 'text-white' : 'text-green-dark'
  }`;

  return (
    <>
      <header className={headerClass}>
        <Link href="/">
          <Image
            src="/bible_TIP_profil_400x400px.svg"
            alt={t('nav.logo_alt')}
            width={36}
            height={36}
            className="h-9"
            style={logoStyle}
          />
        </Link>

        <nav data-testid="desktop-nav" className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              prefetch={link.protected ? false : undefined}
              className={navItemClass(config.activeNav === link.key)}
            >
              {t(link.labelKey)}
            </Link>
          ))}

          <button onClick={handleToggleLanguage} className={navItemClass(false)}>
            {t('nav.language_toggle')}
          </button>

          {isAuthenticated ? (
            <>
              <Link href="/my-page" className={navItemClass(config.activeNav === 'my-page')}>
                {t('nav.my_page')}
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className={
                  isOverlay
                    ? 'rounded-full border border-white/30 px-5 py-2 text-[11px] font-medium tracking-[1px] text-white transition-colors hover:bg-white/10'
                    : 'text-[11px] font-medium tracking-[2px] text-green-dark/50 transition-colors hover:text-green-dark'
                }
              >
                {t('nav.logout')}
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
              {t('nav.sign_in')}
            </Link>
          )}
        </nav>

        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          aria-label={t('nav.menu_open')}
          aria-expanded={mobileNavOpen}
          className={hamburgerClass}
        >
          <span className="icon-lucide text-2xl" aria-hidden="true">
            &#xe115;
          </span>
        </button>
      </header>

      <MobileNav
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        isAuthenticated={isAuthenticated}
        activeNav={config.activeNav}
      />

      {config.subNav && <SubNav activeTab={config.subNav.active} />}
    </>
  );
}
