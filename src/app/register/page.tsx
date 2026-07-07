'use client';

import { Suspense, useState } from 'react';
import { signIn } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import SocialSignInButtons from '@/components/SocialSignInButtons';
import PasswordInput from '@/components/PasswordInput';
import WebviewLoginNotice from '@/components/auth/WebviewLoginNotice';
import { useLanguage } from '@/contexts/LanguageContext';
import { buildAuthRedirectUrl } from '@/lib/redirect-validation';
import { startGoogleRedirect } from '@/lib/google-oauth';
import { startSocialRedirect } from '@/lib/social-oauth';
import type { SocialProvider } from '@/lib/social-oauth';
import { useInAppBrowser } from '@/lib/in-app-browser';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
const KAKAO_REST_API_KEY = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY || '';
const NAVER_CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID || '';

// Referral codes are 8 chars from a 30-char base32-ish alphabet (Crockford
// minus I/L/O/U/0/1) — see tip-backend v2/services/referral.py. We accept a
// generous superset here and let the backend canonicalize.
const REFERRAL_CODE_PATTERN = /^[A-Z0-9]{4,16}$/i;

function RegisterForm() {
  const { t } = useLanguage();
  const webview = useInAppBrowser();
  const searchParams = useSearchParams();
  const rawRef = searchParams?.get('ref') ?? '';
  const referralCode = REFERRAL_CODE_PATTERN.test(rawRef) ? rawRef.toUpperCase() : '';
  // The post-auth destination (e.g. a "Plan My Trip" /concierge?prefill=… URL)
  // threaded in from sign-in. Forwarded to /onboarding so the context survives
  // the sign-up chain; buildAuthRedirectUrl drops it if it isn't a safe path.
  const rawRedirect = searchParams?.get('redirect') ?? '';

  const [step, setStep] = useState<'email' | 'verify'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  // The email is already a registered account. We surface a "sign in /
  // reset password" panel instead of issuing a verification code — see
  // handleSendCode for why.
  const [accountExists, setAccountExists] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Full-page top-level redirect to Google (SMA-133). The /auth/google/callback
  // page completes the exchange + session and routes new users through the
  // onboarding hop (threading the referral + pending redirect). Same-tab
  // redirect avoids the iOS-Safari popup-postMessage failure.
  const handleGoogleClick = () => {
    setError('');
    setIsLoading(true);
    startGoogleRedirect({
      clientId: GOOGLE_CLIENT_ID,
      returnTo: rawRedirect,
      ref: referralCode || null,
      from: 'register',
    });
  };

  // Kakao / Naver mirror the Google full-page redirect (SMA-114). New users
  // are routed through onboarding by the /auth/{provider}/callback page.
  const handleSocialClick = (provider: SocialProvider) => {
    setError('');
    setIsLoading(true);
    startSocialRedirect({
      provider,
      clientId: provider === 'kakao' ? KAKAO_REST_API_KEY : NAVER_CLIENT_ID,
      returnTo: rawRedirect,
      ref: referralCode || null,
      from: 'register',
    });
  };

  const showKakao = !!KAKAO_REST_API_KEY && !webview.inApp;
  const showNaver = !!NAVER_CLIENT_ID && !webview.inApp;
  const showAnySocial = (!!GOOGLE_CLIENT_ID && !webview.inApp) || showKakao || showNaver;

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError(t('register.error_passwords_mismatch'));
      return;
    }
    if (password.length < 8) {
      setError(t('register.error_password_too_short'));
      return;
    }

    setError('');
    setAccountExists(false);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code_type: 'register' }),
      });
      // 409 = this email already has an account. The backend deliberately
      // refuses to issue a code here: the old flow let it through and then
      // failed at register(), which the UI showed on the code screen so a
      // correct code looked "wrong". Route the user to sign-in / reset.
      if (res.status === 409) {
        setAccountExists(true);
        return;
      }
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || t('register.error_send_code_failed'));
      }
      setStep('verify');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('register.error_send_code_failed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Step 1: Verify email code
      const verifyRes = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          verification_code: verificationCode,
          code_type: 'register',
        }),
      });
      if (!verifyRes.ok) {
        const data = await verifyRes.json();
        throw new Error(data.message || t('register.error_invalid_code'));
      }

      // Step 2: Register via backend
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          verification_code: verificationCode,
          ...(referralCode ? { referral_code: referralCode } : {}),
        }),
      });
      // Defense-in-depth: if a code was somehow already in flight for an
      // existing email, register() still rejects with 409 — show the same
      // sign-in / reset panel rather than a "registration failed" error.
      if (res.status === 409) {
        setStep('email');
        setAccountExists(true);
        setIsLoading(false);
        return;
      }
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || t('register.error_registration_failed'));
      }

      // Step 3: Sign in via NextAuth to establish the session
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      if (result?.error) throw new Error(t('register.error_signin_after_register'));

      // Forward the referral code into onboarding so the new step can
      // prefill it and attempt the claim from there. For email signups the
      // backend already claimed at register-time, so the onboarding step
      // will see referred_by populated and auto-advance — but threading
      // the param keeps the Google path covered uniformly. The pending
      // redirect rides alongside so trip-planning context survives onboarding.
      window.location.href = buildAuthRedirectUrl('/onboarding', {
        ref: referralCode,
        redirect: rawRedirect,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('register.error_registration_failed'));
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-8 w-full max-w-[420px] overflow-hidden rounded-xl bg-white shadow-lg">
      {referralCode && (
        <div className="border-b border-gold/30 bg-gold/10 px-6 py-3 text-center text-sm text-green-dark md:px-8">
          {t('register.invited_by_prefix')}
          <span className="font-mono font-semibold">{referralCode}</span>
          {t('register.invited_by_suffix')}
        </div>
      )}
      {step === 'email' && accountExists ? (
        <div className="flex flex-col gap-5 p-6 md:p-8" data-testid="account-exists-panel">
          <h2 className="text-center text-[20px] font-semibold text-green-dark">
            {t('register.sign_up')}
          </h2>

          <div className="rounded-lg bg-gold/10 p-4 text-center text-sm">
            <p className="font-medium text-green-dark">{t('register.account_exists_title')}</p>
            <p className="mt-1 text-gray-text">{t('register.account_exists_body')}</p>
          </div>

          <Link
            href={`/sign-in?email=${encodeURIComponent(email)}`}
            className="flex h-12 w-full items-center justify-center rounded-lg bg-green-dark text-white"
          >
            {t('register.sign_in')}
          </Link>

          <Link
            href={`/forgot-password?email=${encodeURIComponent(email)}`}
            className="flex h-12 w-full items-center justify-center rounded-lg border border-green-dark text-green-dark"
          >
            {t('register.reset_password')}
          </Link>

          <button
            type="button"
            onClick={() => {
              setAccountExists(false);
              setEmail('');
              setPassword('');
              setConfirmPassword('');
            }}
            className="text-sm text-green-dark hover:underline"
          >
            {t('register.use_different_email')}
          </button>
        </div>
      ) : step === 'email' ? (
        <div className="flex flex-col gap-6 p-6 md:p-8">
          <h2 className="text-center text-[20px] font-semibold text-green-dark">
            {t('register.sign_up')}
          </h2>

          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

          {showAnySocial && (
            <>
              <div className="flex flex-col gap-3">
                {GOOGLE_CLIENT_ID && !webview.inApp && (
                  <GoogleSignInButton onClick={handleGoogleClick} disabled={isLoading} />
                )}
                {(showKakao || showNaver) && (
                  <SocialSignInButtons
                    onProviderClick={handleSocialClick}
                    providers={[
                      ...(showKakao ? (['kakao'] as const) : []),
                      ...(showNaver ? (['naver'] as const) : []),
                    ]}
                    disabled={isLoading}
                  />
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-xs text-gray-text">{t('register.or')}</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>
            </>
          )}

          {webview.inApp && <WebviewLoginNotice info={webview} />}

          <form onSubmit={handleSendCode} className="flex flex-col gap-6">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('register.email_placeholder')}
              required
              disabled={isLoading}
              className="w-full rounded-lg border border-gray-200 px-4 py-3"
            />

            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('register.create_password_placeholder')}
              required
              disabled={isLoading}
              className="w-full rounded-lg border border-gray-200 px-4 py-3"
            />

            <PasswordInput
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t('register.confirm_password_placeholder')}
              required
              disabled={isLoading}
              className="w-full rounded-lg border border-gray-200 px-4 py-3"
            />

            <button
              type="submit"
              disabled={isLoading}
              className="h-12 w-full rounded-lg bg-green-dark text-white disabled:opacity-50"
            >
              {isLoading ? t('register.sending_code') : t('register.send_code')}
            </button>
          </form>
        </div>
      ) : (
        <form onSubmit={handleRegister} className="flex flex-col gap-6 p-6 md:p-8">
          <h2 className="text-center text-[20px] font-semibold text-green-dark">
            {t('register.verify_title')}
          </h2>

          <p className="text-center text-sm text-gray-text">
            {t('register.code_sent_prefix')}
            <strong>{email}</strong>
          </p>

          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

          <input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            placeholder={t('register.code_placeholder')}
            required
            maxLength={6}
            disabled={isLoading}
            className="w-full rounded-lg border border-gray-200 px-4 py-3 text-center text-2xl tracking-widest"
          />

          <button
            type="submit"
            disabled={isLoading}
            className="h-12 w-full rounded-lg bg-green-dark text-white disabled:opacity-50"
          >
            {isLoading ? t('register.creating_account') : t('register.complete_registration')}
          </button>

          <button
            type="button"
            onClick={() => setStep('email')}
            className="text-sm text-green-dark hover:underline"
          >
            {t('register.change_email')}
          </button>
        </form>
      )}

      <div className="border-t border-gray-100 bg-gray-50 px-6 py-4 text-center text-sm md:px-8">
        <span className="text-gray-text">{t('register.already_have_account')}</span>
        <Link href="/sign-in" className="font-medium text-green-dark hover:underline">
          {t('register.sign_in')}
        </Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const { t } = useLanguage();
  return (
    <main className="flex min-h-screen flex-col bg-gray-light">
      <div className="flex h-14 items-center justify-between border-b border-gray-border bg-white px-4 md:px-10">
        <Link href="/">
          <Image
            src="/bible_TIP_profil_400x400px.svg"
            alt={t('register.logo_alt')}
            className="h-9"
            width={36}
            height={36}
          />
        </Link>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 md:px-10">
        <div className="text-center">
          <h1 className="font-primary text-[32px] italic text-green-dark md:text-[48px]">
            {t('register.headline')}
          </h1>
          <p className="mt-2 text-gray-text">{t('register.subtitle')}</p>
        </div>

        {/* useSearchParams requires a Suspense boundary in App Router. */}
        <Suspense fallback={null}>
          <RegisterForm />
        </Suspense>
      </div>
    </main>
  );
}
