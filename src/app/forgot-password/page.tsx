'use client';

import { Suspense, useState } from 'react';
import { signIn } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import DeliveryFailedDialog from '@/components/DeliveryFailedDialog';
import PasswordInput from '@/components/PasswordInput';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVerificationDeliveryStatus } from '@/hooks/useVerificationDeliveryStatus';

function ForgotPasswordForm() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<'email' | 'reset'>('email');
  // Pre-fill the email when arriving from the signup screen's "account
  // already exists" panel (it links here with ?email=).
  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // While the user waits on the code step, poll whether the verification
  // email bounced (Brevo webhook flag) and surface a dialog if it did.
  const delivery = useVerificationDeliveryStatus(email, step === 'reset');
  const [deliveryDialogDismissed, setDeliveryDialogDismissed] = useState(false);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code_type: 'forgot-password' }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || t('forgot.error_send_failed'));
      }
      setDeliveryDialogDismissed(false);
      setStep('reset');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('forgot.error_send_failed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError(t('forgot.error_passwords_mismatch'));
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      // Step 1: Reset password via backend
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          verification_code: verificationCode,
          password: newPassword,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || t('forgot.error_reset_failed'));
      }

      // Step 2: Sign in via NextAuth to establish the session
      const result = await signIn('credentials', {
        email,
        password: newPassword,
        redirect: false,
      });
      if (result?.error) throw new Error(t('forgot.error_signin_after_reset'));

      window.location.href = '/my-page';
    } catch (err) {
      setError(err instanceof Error ? err.message : t('forgot.error_reset_failed'));
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-8 w-[420px] overflow-hidden rounded-xl bg-white shadow-lg">
      {step === 'email' ? (
        <form onSubmit={handleSendCode} className="flex flex-col gap-6 p-8">
          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('forgot.email_placeholder')}
            required
            disabled={isLoading}
            className="w-full rounded-lg border border-gray-200 px-4 py-3"
          />

          <button
            type="submit"
            disabled={isLoading}
            className="h-12 w-full rounded-lg bg-green-dark text-white disabled:opacity-50"
          >
            {isLoading ? t('forgot.sending_code') : t('forgot.send_code')}
          </button>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="flex flex-col gap-6 p-8">
          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

          <input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            placeholder={t('forgot.code_placeholder')}
            required
            maxLength={6}
            disabled={isLoading}
            className="w-full rounded-lg border border-gray-200 px-4 py-3 text-center"
          />

          <PasswordInput
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder={t('forgot.new_password_placeholder')}
            required
            disabled={isLoading}
            className="w-full rounded-lg border border-gray-200 px-4 py-3"
          />

          <PasswordInput
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={t('forgot.confirm_password_placeholder')}
            required
            disabled={isLoading}
            className="w-full rounded-lg border border-gray-200 px-4 py-3"
          />

          <button
            type="submit"
            disabled={isLoading}
            className="h-12 w-full rounded-lg bg-green-dark text-white disabled:opacity-50"
          >
            {isLoading ? t('forgot.resetting') : t('forgot.reset_password')}
          </button>
        </form>
      )}

      <div className="border-t border-gray-100 bg-gray-50 px-8 py-4 text-center text-sm">
        <Link href="/sign-in" className="font-medium text-green-dark hover:underline">
          {t('forgot.back_to_sign_in')}
        </Link>
      </div>

      <DeliveryFailedDialog
        isOpen={step === 'reset' && delivery.failed && !deliveryDialogDismissed}
        email={email}
        onUseDifferentEmail={() => {
          setVerificationCode('');
          setStep('email');
        }}
        onClose={() => setDeliveryDialogDismissed(true)}
      />
    </div>
  );
}

export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  return (
    <main className="flex min-h-screen flex-col bg-gray-light">
      <div className="flex h-14 items-center justify-between border-b border-gray-border bg-white px-10">
        <Link href="/">
          <Image
            src="/bible_TIP_profil_400x400px.svg"
            alt={t('forgot.logo_alt')}
            width={36}
            height={36}
            className="h-9"
          />
        </Link>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-10">
        <div className="text-center">
          <h1 className="font-primary text-[48px] italic text-green-dark">
            {t('forgot.headline')}
          </h1>
          <p className="mt-2 text-gray-text">{t('forgot.subtitle')}</p>
        </div>

        {/* useSearchParams requires a Suspense boundary in App Router. */}
        <Suspense
          fallback={<div className="mt-8 h-64 w-[420px] animate-pulse rounded-xl bg-white" />}
        >
          <ForgotPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
