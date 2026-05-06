'use client';

// /checkout/flywire — consumer-facing wrapper around the Flywire Checkout
// JS widget.
//
// The deterministic checkout URL we redirect to from /quotes/[id] carries
// only ?payment_id=N. Everything else (recipient code, amount, currency,
// callback URL/id, return URLs, booking reference) is fetched from the
// authenticated /api/payments/{id}/widget-config endpoint so a malicious
// user can't tamper with the amount via the URL.
//
// FlywirePayment.initiate() opens the secure checkout as a modal overlay
// itself — there is no host element to render into. This page just shows
// a small "opening checkout" status panel that sits behind the modal. If
// the script never resolves window.FlywirePayment within 5s of being
// injected, we surface a refresh CTA rather than spin forever.

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Script from 'next/script';
import TopBar from '@/components/TopBar';
import Footer from '@/components/Footer';
import { apiClient } from '@/lib/api-client';
import type { WidgetConfig } from '@/types/payment';
import type { Trip, TripVersion } from '@/types/trip';

const SCRIPT_URL = process.env.NEXT_PUBLIC_FLYWIRE_SCRIPT_URL ?? '';
const FLYWIRE_ENV = process.env.NEXT_PUBLIC_FLYWIRE_ENV ?? 'demo';
const SCRIPT_TIMEOUT_MS = 5_000;

// The widget-config response doesn't include trip_id directly. Pull it out
// of the return_url, which the backend builds as `/quotes/{quote_id}?paid=1`.
// Best-effort only — failure → render the page without the trip title.
function extractQuoteIdFromReturnUrl(returnUrl: string): number | null {
  try {
    const u = new URL(returnUrl);
    const match = u.pathname.match(/\/quotes\/(\d+)(?:\/.*)?$/);
    return match ? Number(match[1]) : null;
  } catch {
    return null;
  }
}

export default function FlywireCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50">
          <TopBar activeLink="My Page" />
          <div className="max-w-3xl mx-auto px-6 mt-8 space-y-4 animate-pulse">
            <div className="h-8 w-2/3 bg-gray-200 rounded" />
            <div className="h-[480px] bg-gray-200 rounded-2xl" />
          </div>
          <Footer />
        </div>
      }
    >
      <FlywireCheckoutContent />
    </Suspense>
  );
}

function FlywireCheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status: sessionStatus } = useSession();

  const paymentIdRaw = searchParams.get('payment_id');
  const paymentId = paymentIdRaw ? Number(paymentIdRaw) : NaN;

  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [tripTitle, setTripTitle] = useState<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [scriptFailed, setScriptFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorBackHref, setErrorBackHref] = useState<string>('/my-page');
  const [widgetMounted, setWidgetMounted] = useState(false);

  // Auth gate. Bounce the user back here after sign-in.
  useEffect(() => {
    if (sessionStatus !== 'unauthenticated') return;
    const callbackUrl = `/checkout/flywire?payment_id=${paymentIdRaw ?? ''}`;
    router.replace(`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }, [sessionStatus, router, paymentIdRaw]);

  // Fetch widget config + (best-effort) trip title.
  useEffect(() => {
    if (sessionStatus !== 'authenticated') return;
    if (!paymentIdRaw || Number.isNaN(paymentId)) {
      setError('Missing or invalid payment_id.');
      setLoading(false);
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const cfg = await apiClient.getWidgetConfig(paymentId);
        if (cancelled) return;
        setConfig(cfg);

        const quoteId = extractQuoteIdFromReturnUrl(cfg.return_url);
        if (quoteId !== null) {
          setErrorBackHref(`/quotes/${quoteId}`);
          // Best-effort: pull the trip title via the existing trip APIs.
          try {
            const bundle = await apiClient.getQuote(quoteId);
            if (cancelled) return;
            const [, tripVersion] = (await Promise.all([
              apiClient.getTripById(bundle.quote.trip_id).catch(() => null),
              apiClient.getCurrentTripVersion(bundle.quote.trip_id).catch(() => null),
            ])) as [Trip | null, TripVersion | null];
            if (!cancelled && tripVersion?.title) {
              setTripTitle(tripVersion.title);
            }
          } catch {
            // Silent — header falls back to "Complete payment".
          }
        }
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Failed to load checkout config';
        // Map common cases to friendlier copy.
        if (message.toLowerCase().includes('not found')) {
          setError('Quote not found.');
        } else if (
          message.toLowerCase().includes('sent') ||
          message.toLowerCase().includes('status')
        ) {
          setError('This quote is no longer awaiting payment.');
        } else {
          setError(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [sessionStatus, paymentIdRaw, paymentId]);

  // Script-failure timeout. If FlywirePayment isn't on window 5s after we
  // injected the <Script>, give up and show a refresh CTA. Successful
  // onLoad clears scriptFailed via setScriptReady before the timer fires.
  useEffect(() => {
    if (!SCRIPT_URL) return;
    if (scriptReady) return;
    const handle = setTimeout(() => {
      if (typeof window !== 'undefined' && !window.FlywirePayment) {
        setScriptFailed(true);
      }
    }, SCRIPT_TIMEOUT_MS);
    return () => clearTimeout(handle);
  }, [scriptReady]);

  // Mount the Flywire widget once both prerequisites are in.
  useEffect(() => {
    if (!config || !scriptReady) return;
    if (widgetMounted) return;
    if (typeof window === 'undefined' || !window.FlywirePayment) return;

    try {
      // `currency` is intentionally NOT passed: it isn't a documented
      // FlywirePayment.initiate() parameter — Flywire derives currency
      // from the portal (PARSC = KRW). `requestPayerInfo: true` makes
      // the widget collect payer details (firstName/lastName/email/etc.)
      // itself; without it AND without pre-filled payer fields, Flywire
      // bails with "Your payer information is not valid" before
      // rendering the form. Pre-filling from the logged-in user is the
      // better UX once we have proper account-level data wired through.
      window.FlywirePayment.initiate({
        env: FLYWIRE_ENV,
        recipientCode: config.portal_code,
        amount: parseFloat(config.amount),
        callbackUrl: config.callback_url,
        callbackId: config.callback_id,
        callbackVersion: config.callback_version,
        returnUrl: config.return_url,
        recipientFields: { booking_reference: config.booking_reference },
        requestPayerInfo: true,
      });
      setWidgetMounted(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to initialise checkout widget';
      setError(msg);
    }
  }, [config, scriptReady, widgetMounted]);

  if (sessionStatus === 'loading' || (sessionStatus === 'authenticated' && loading)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopBar activeLink="My Page" />
        <div className="max-w-3xl mx-auto px-6 mt-8 space-y-4 animate-pulse">
          <div className="h-8 w-2/3 bg-gray-200 rounded" />
          <div className="h-[480px] bg-gray-200 rounded-2xl" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopBar activeLink="My Page" />
        <div className="max-w-3xl mx-auto px-6 mt-8 text-center py-20">
          <p className="text-gray-700 text-base mb-4">{error}</p>
          <Link
            href={errorBackHref}
            className="inline-block text-[#1E3D2F] hover:underline text-sm"
          >
            ← Back
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar activeLink="My Page" />

      {SCRIPT_URL && (
        <Script
          src={SCRIPT_URL}
          strategy="afterInteractive"
          onLoad={() => setScriptReady(true)}
          onError={() => setScriptFailed(true)}
        />
      )}

      <div className="max-w-3xl mx-auto px-6 mt-8 mb-16 space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Complete payment</h1>
          {tripTitle && <p className="text-sm text-gray-500 mt-1">{tripTitle}</p>}
        </div>

        {scriptFailed ? (
          <div
            data-testid="flywire-script-failure"
            className="rounded-xl border border-red-200 bg-red-50 px-5 py-6 text-center"
          >
            <p className="text-sm font-semibold text-red-800 mb-2">
              Couldn&apos;t load the secure checkout.
            </p>
            <p className="text-xs text-red-700/80 mb-4">
              The payment provider script failed to initialise. Please refresh and try again.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center px-5 py-2 bg-red-700 text-white text-sm font-semibold rounded-full hover:bg-red-800"
            >
              Refresh
            </button>
          </div>
        ) : (
          <div
            data-testid="flywire-checkout-status"
            className="rounded-2xl border border-gray-200 bg-white px-6 py-12 text-center"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
              <span className="block w-5 h-5 rounded-full border-2 border-gray-300 border-t-[#1E3D2F] animate-spin" />
            </div>
            <p className="text-sm font-semibold text-gray-900 mb-1">Opening secure checkout…</p>
            <p className="text-xs text-gray-500">
              Flywire&apos;s payment window will appear in a moment.
            </p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
