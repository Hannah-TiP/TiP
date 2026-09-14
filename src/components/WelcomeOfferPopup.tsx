'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBenefits } from '@/hooks/useBenefits';
import { maxBenefitPoints } from '@/lib/benefits';
import { formatPoints } from '@/lib/points-wallet';

const DISMISS_DAYS = 7;
const OPEN_DELAY_MS = 400;
const CLOSE_ANIMATION_MS = 300;

export default function WelcomeOfferPopup() {
  const { lang, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The welcome grant figure comes from the registry's `signup_welcome`
  // entry (SMA-267 flat grant, SMA-358 in P) — a flat value, so max ==
  // every tier. Null (endpoint down) drops the figure, never invents one.
  const benefits = useBenefits();
  const welcomePoints = maxBenefitPoints(benefits, 'signup_welcome');
  const pointsLabel = welcomePoints === null ? null : formatPoints(welcomePoints);
  const body =
    pointsLabel === null
      ? t('welcome_offer.body')
      : t('welcome_offer.body_points').replace('{points}', pointsLabel);
  const cta =
    pointsLabel === null
      ? t('welcome_offer.cta')
      : t('welcome_offer.cta_points').replace('{points}', pointsLabel);

  useEffect(() => {
    const storageKey = `tiyp_popup_dismiss_until_v2_${lang}`;
    const dismissUntil = Number.parseInt(localStorage.getItem(storageKey) || '0', 10);
    if (Date.now() <= dismissUntil) {
      // The active language can switch after first paint (SSR default → client
      // detection ladder). If the popup already opened under the previous
      // language and the reconciled one is dismissed, close it — a dismissed
      // language must never keep the offer on screen.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsOpen(false);
      return;
    }

    const openTimer = window.setTimeout(() => setIsOpen(true), OPEN_DELAY_MS);
    return () => window.clearTimeout(openTimer);
  }, [lang]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const dismiss = useCallback(() => {
    localStorage.setItem(
      `tiyp_popup_dismiss_until_v2_${lang}`,
      String(Date.now() + DISMISS_DAYS * 86_400_000),
    );
    setIsClosing(true);
    closeTimerRef.current = setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, CLOSE_ANIMATION_MS);
  }, [lang]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dismiss, isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-[1000] flex items-center justify-center bg-[rgba(10,10,10,0.6)] p-4 transition-opacity duration-300 sm:p-6 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) dismiss();
      }}
      data-testid="welcome-offer-popup"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-offer-title"
        className={`relative grid max-h-[92vh] w-full max-w-[920px] overflow-y-auto rounded-[4px] bg-[#202124] shadow-[0_30px_80px_rgba(0,0,0,0.5)] transition-transform duration-[350ms] ease-out md:h-[520px] md:grid-cols-[0.85fr_1fr] md:overflow-hidden ${
          isClosing ? 'translate-y-3 scale-[0.96]' : 'translate-y-0 scale-100'
        }`}
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label={t('welcome_offer.close')}
          className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-black/25 text-lg leading-none text-white/90 transition-colors hover:bg-black/45"
        >
          ×
        </button>

        <div className="relative h-[190px] min-w-0 md:h-full">
          <Image
            src={
              lang === 'kr'
                ? '/welcome-offer/hotel-window-view.webp'
                : '/welcome-offer/mountain-dining-view.webp'
            }
            alt={t('welcome_offer.image_alt')}
            fill
            sizes="(max-width: 767px) 100vw, 420px"
            className="object-cover"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#202124] md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-[#202124]" />
        </div>

        <div className="flex min-w-0 flex-col justify-center gap-4 px-6 pb-8 pt-5 md:gap-5 md:px-12 md:py-14">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#d0a749]">
            {t('welcome_offer.eyebrow')}
          </p>
          <h2
            id="welcome-offer-title"
            className="font-primary text-[32px] font-medium italic leading-[1.2] text-[#f5f5f4] md:text-[40px]"
          >
            {t('welcome_offer.headline_line1')}
            <br />
            {t('welcome_offer.headline_line2')}
          </h2>
          <p className="max-w-[400px] text-[15px] leading-[1.65] text-white/70 md:text-[16px]">
            {body}
          </p>
          <div className="mt-1">
            <Link
              href="/register"
              onClick={dismiss}
              className="inline-flex items-center rounded-[2px] bg-[#285d4d] px-7 py-4 text-[15px] font-semibold tracking-[0.02em] text-[#faf8ef] transition-colors hover:bg-[#34715e]"
            >
              {cta}
            </Link>
          </div>
          <p className="text-[12px] text-white/40">{t('welcome_offer.fine_print')}</p>
        </div>
      </section>
    </div>
  );
}
