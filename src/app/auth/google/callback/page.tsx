'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { getSession, signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import type { TranslationKeys } from '@/contexts/LanguageContext';
import { buildAuthRedirectUrl, isSafeRedirectPath } from '@/lib/redirect-validation';
import { GOOGLE_NONCE_STORAGE_KEY, decodeState } from '@/lib/google-oauth';
import type { GoogleOAuthState } from '@/lib/google-oauth';

const DEFAULT_REDIRECT = '/my-page';

/** Where to send the user back to on error, based on the originating page. */
function originPath(state: GoogleOAuthState | null): string {
  return state?.from === 'register' ? '/register' : '/sign-in';
}

function GoogleCallback() {
  const { t, lang } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  // The callback effect must run exactly once even under React StrictMode's
  // double-invoke in dev (the auth code is single-use, so a second exchange
  // would fail with invalid_grant).
  const startedRef = useRef(false);
  const [error, setError] = useState('');
  const [backHref, setBackHref] = useState('/sign-in');

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const code = searchParams.get('code');
    const rawState = searchParams.get('state');
    const oauthError = searchParams.get('error');
    const state = decodeState(rawState);

    const back = originPath(state);
    setBackHref(back);

    const fail = (messageKey: TranslationKeys) => {
      setError(t(messageKey));
      // Bounce the user back to where they began after a short beat so the
      // error message is readable; never leave them on a dead-end callback.
      window.setTimeout(() => router.replace(back), 2500);
    };

    // Verify the CSRF nonce round-tripped via sessionStorage, then clear it
    // so a stale value can't be replayed.
    const storedNonce = window.sessionStorage.getItem(GOOGLE_NONCE_STORAGE_KEY);
    window.sessionStorage.removeItem(GOOGLE_NONCE_STORAGE_KEY);

    if (oauthError) {
      // User cancelled at the Google consent screen, or Google returned an
      // OAuth error (e.g. access_denied).
      fail(
        oauthError === 'access_denied'
          ? 'auth.error_google_cancelled'
          : 'google_callback.error_failed',
      );
      return;
    }

    if (!code || !state || !storedNonce || storedNonce !== state.nonce) {
      fail('google_callback.error_failed');
      return;
    }

    const returnTo = state.returnTo && isSafeRedirectPath(state.returnTo) ? state.returnTo : '';

    const exchange = async () => {
      try {
        // Send the OAuth authorization code to the backend via proxy. The
        // backend exchanges it for tokens using the registered redirect URI
        // (SMA-133).
        const res = await fetch('/api/auth/social-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Language: lang },
          body: JSON.stringify({ provider: 'google', auth_code: code }),
        });

        if (!res.ok) {
          fail('google_callback.error_failed');
          return;
        }

        const { data } = await res.json();

        const result = await signIn('social-login', {
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          redirect: false,
        });

        if (result?.error) {
          fail('google_callback.error_failed');
          return;
        }

        const session = await getSession();
        const needsOnboarding = session?.user && !session.user.onboarding_completed;
        // New users go through /onboarding first, threading the pending
        // redirect (and referral) so trip-planning context survives the hop.
        window.location.href = needsOnboarding
          ? buildAuthRedirectUrl('/onboarding', {
              ref: state.ref ?? undefined,
              redirect: returnTo,
            })
          : returnTo || DEFAULT_REDIRECT;
      } catch {
        fail('google_callback.error_failed');
      }
    };

    void exchange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-light px-4">
      {error ? (
        <div className="flex w-full max-w-[420px] flex-col items-center gap-4 rounded-xl bg-white p-8 text-center shadow-lg">
          <h1 className="text-[20px] font-semibold text-green-dark">
            {t('google_callback.error_title')}
          </h1>
          <p className="text-sm text-red-600">{error}</p>
          <button
            type="button"
            onClick={() => router.replace(backHref)}
            className="flex h-11 w-full items-center justify-center rounded-lg bg-green-dark text-white transition-opacity hover:opacity-90"
          >
            {t('google_callback.back_to_sign_in')}
          </button>
        </div>
      ) : (
        <div
          className="flex flex-col items-center gap-4 text-center"
          data-testid="google-callback-loading"
        >
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-green-dark" />
          <p className="text-gray-text">{t('google_callback.completing')}</p>
        </div>
      )}
    </main>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={null}>
      <GoogleCallback />
    </Suspense>
  );
}
