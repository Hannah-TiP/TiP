'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { useLanguage } from '@/contexts/LanguageContext';
import { navLinks } from '@/lib/nav-links';
import type { NavKey } from '@/lib/header-config';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  activeNav: NavKey | null;
}

/**
 * Slide-in mobile navigation drawer. Rendered (always mounted) by <Header> so
 * the enter/exit CSS transition can play; visibility is driven by `isOpen`.
 *
 * The drawer is a solid-background overlay on top of everything — it does NOT
 * inherit the overlay Header's transparent/white-text treatment, so it stays
 * legible regardless of which Header variant is active.
 */
export default function MobileNav({ isOpen, onClose, isAuthenticated, activeNav }: MobileNavProps) {
  const { lang, setLang, t } = useLanguage();

  // Escape-to-close + body scroll lock while open. Both cleaned up on close
  // and on unmount so we never leave the page un-scrollable.
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  const linkClass = (active: boolean) =>
    `whitespace-nowrap text-[13px] font-medium tracking-[2px] transition-colors ${
      active ? 'text-green-dark' : 'text-green-dark/60 hover:text-green-dark'
    }`;

  return (
    <>
      {/* Backdrop */}
      <div
        data-testid="mobile-nav-backdrop"
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ease-in-out md:hidden ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* Drawer */}
      <aside
        data-testid="mobile-nav-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={t('nav.menu_open')}
        aria-hidden={!isOpen}
        className={`fixed inset-y-0 right-0 z-50 flex w-[280px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex h-[64px] items-center justify-end border-b border-gray-border px-4">
          <button
            type="button"
            onClick={onClose}
            aria-label={t('nav.menu_close')}
            className="flex h-11 w-11 items-center justify-center rounded-full text-green-dark transition-colors hover:bg-gray-light"
          >
            <span className="icon-x text-xl" aria-hidden="true" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-6 py-6">
          {navLinks.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              prefetch={link.protected ? false : undefined}
              onClick={onClose}
              className={`${linkClass(activeNav === link.key)} py-3`}
            >
              {link.label}
            </Link>
          ))}

          <button
            type="button"
            onClick={() => setLang(lang === 'en' ? 'kr' : 'en')}
            className={`${linkClass(false)} py-3 text-left`}
          >
            {t('nav.language_toggle')}
          </button>
        </nav>

        <div className="flex flex-col gap-3 border-t border-gray-border px-6 py-6">
          {isAuthenticated ? (
            <>
              <Link
                href="/my-page"
                onClick={onClose}
                className={`${linkClass(activeNav === 'my-page')} py-2`}
              >
                {t('nav.my_page')}
              </Link>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  signOut({ callbackUrl: '/' });
                }}
                className="rounded-full border border-green-dark px-5 py-3 text-center text-[12px] font-medium tracking-[2px] text-green-dark transition-colors hover:bg-green-dark hover:text-white"
              >
                {t('nav.logout')}
              </button>
            </>
          ) : (
            <Link
              href="/sign-in"
              onClick={onClose}
              className="rounded-full border border-green-dark px-5 py-3 text-center text-[12px] font-medium tracking-[2px] text-green-dark transition-colors hover:bg-green-dark hover:text-white"
            >
              {t('nav.sign_in')}
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
