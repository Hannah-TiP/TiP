'use client';

import { Suspense, useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { buildAuthRedirectUrl, isSafeRedirectPath } from '@/lib/redirect-validation';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import { useInAppBrowser } from '@/lib/in-app-browser';
import PasswordInput from '@/components/PasswordInput';
import WebviewLoginNotice from '@/components/auth/WebviewLoginNotice';
import { useLanguage } from '@/contexts/LanguageContext';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
const DEFAULT_REDIRECT = '/my-page';

function SignInForm() {
  const { t, lang } = useLanguage();
  const webview = useInAppBrowser();
  const searchParams = useSearchParams();
  // Pre-fill the email when arriving from the signup screen's "account
  // already exists" panel (it links here with ?email=).
  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Accept both `callbackUrl` (NextAuth convention used by callers like the
  // hotel-page Reserve flow and the Flywire checkout page) and the legacy
  // `redirect` param. Either drops the user back where they came from after
  // a successful sign-in. Both are guarded by `isSafeRedirectPath` so a
  // crafted query like `?callbackUrl=https://evil.com` or `?callbackUrl=//evil.com`
  // can't bounce the user off-site after auth.
  const rawCallback = searchParams.get('callbackUrl');
  const rawRedirect = searchParams.get('redirect');
  const safeRedirect =
    (rawCallback && isSafeRedirectPath(rawCallback) ? rawCallback : null) ||
    (rawRedirect && isSafeRedirectPath(rawRedirect) ? rawRedirect : null) ||
    '';
  const redirectTo = safeRedirect || DEFAULT_REDIRECT;

  // Forward a referral code through to /register if the user clicks "Sign up"
  // from this page. The actual claim happens at register-time on the backend.
  const rawRef = searchParams.get('ref') ?? '';
  const referralCode = /^[A-Z0-9]{4,16}$/i.test(rawRef) ? rawRef.toUpperCase() : '';

  const handleGoogleSuccess = async (authCode: string) => {
    setError('');
    setIsLoading(true);

    try {
      // Send the OAuth authorization code to the backend via proxy. The
      // backend exchanges it for tokens server-side (SMA-119).
      const res = await fetch('/api/auth/social-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Language: lang },
        body: JSON.stringify({
          provider: 'google',
          auth_code: authCode,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || t('auth.error_google_failed'));
      }

      const { data } = await res.json();

      // Establish NextAuth session using the social-login provider
      const result = await signIn('social-login', {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        redirect: false,
      });

      if (result?.error) {
        throw new Error(t('auth.error_session_failed'));
      }

      const session = await getSession();
      const needsOnboarding = session?.user && !session.user.onboarding_completed;
      // When onboarding is still required, thread the pending redirect (and
      // referral) through /onboarding so the trip-planning context survives to
      // the end of the chain — see buildAuthRedirectUrl.
      window.location.href = needsOnboarding
        ? buildAuthRedirectUrl('/onboarding', { ref: referralCode, redirect: safeRedirect })
        : redirectTo;
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.error_google_failed'));
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        setError(t('auth.error_invalid_credentials'));
      } else {
        const session = await getSession();
        const needsOnboarding = session?.user && !session.user.onboarding_completed;
        window.location.href = needsOnboarding
          ? buildAuthRedirectUrl('/onboarding', { ref: referralCode, redirect: safeRedirect })
          : redirectTo;
      }
    } catch {
      setError(t('auth.error_login_failed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-8 w-full max-w-[420px] overflow-hidden rounded-xl bg-white shadow-lg">
      <div className="flex flex-col gap-6 p-6 md:p-8">
        <h2 className="text-center text-[20px] font-semibold text-green-dark">
          {t('auth.welcome_back')}
        </h2>

        {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

        {GOOGLE_CLIENT_ID && !webview.inApp && (
          <>
            <GoogleSignInButton
              onCode={handleGoogleSuccess}
              onFailure={() => setError(t('auth.error_google_failed'))}
              onCancel={() => setError(t('auth.error_google_cancelled'))}
              disabled={isLoading}
            />

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-xs text-gray-text">{t('auth.or')}</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>
          </>
        )}

        {webview.inApp && <WebviewLoginNotice info={webview} />}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('auth.email_placeholder')}
            required
            disabled={isLoading}
            className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-green-dark"
          />

          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('auth.password_placeholder')}
            required
            disabled={isLoading}
            className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-green-dark"
          />

          <Link href="/forgot-password" className="text-sm text-green-dark hover:underline">
            {t('auth.forgot_password')}
          </Link>

          <button
            type="submit"
            disabled={isLoading}
            className="flex h-12 w-full items-center justify-center rounded-lg bg-green-dark text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isLoading ? t('auth.signing_in') : t('auth.continue')}
          </button>
        </form>
      </div>

      <div className="border-t border-gray-100 bg-gray-50 px-6 py-4 text-center text-sm md:px-8">
        <span className="text-gray-text">{t('auth.no_account')}</span>
        <Link
          href={buildAuthRedirectUrl('/register', {
            ref: referralCode,
            redirect: rawRedirect ?? undefined,
          })}
          className="font-medium text-green-dark hover:underline"
        >
          {t('auth.sign_up')}
        </Link>
      </div>
    </div>
  );
}

export default function SignInPage() {
  const { t } = useLanguage();
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <main className="flex min-h-screen flex-col bg-gray-light">
        {/* Top Bar */}
        <div className="flex h-14 items-center justify-between border-b border-gray-border bg-white px-4 md:px-10">
          <Link href="/">
            <Image
              src="/bible_TIP_profil_400x400px.svg"
              alt={t('auth.logo_alt')}
              className="h-9"
              width={36}
              height={36}
            />
          </Link>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 md:px-10">
          <div className="text-center">
            <h1 className="font-primary text-[32px] italic text-green-dark md:text-[48px]">
              {t('auth.sign_in_headline')}
            </h1>
            <p className="mt-2 text-gray-text">{t('auth.sign_in_subtitle')}</p>
          </div>

          <Suspense
            fallback={
              <div className="mt-8 h-64 w-full max-w-[420px] animate-pulse rounded-xl bg-white" />
            }
          >
            <SignInForm />
          </Suspense>
        </div>
      </main>
    </GoogleOAuthProvider>
  );
}
