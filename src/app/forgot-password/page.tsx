'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { getDeviceId } from '@/lib/device';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
        throw new Error(data.message || 'Failed to send code');
      }
      setStep('reset');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const device_id = await getDeviceId();

      // Step 1: Reset password via backend
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          verification_code: verificationCode,
          password: newPassword,
          device_id,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Password reset failed');
      }

      // Step 2: Sign in via NextAuth to establish the session
      const result = await signIn('credentials', {
        email,
        password: newPassword,
        device_id,
        redirect: false,
      });
      if (result?.error) throw new Error('Failed to sign in after password reset');

      window.location.href = '/my-page';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password reset failed');
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-gray-light">
      <div className="flex h-14 items-center justify-between border-b border-gray-border bg-white px-10">
        <Link href="/" className="font-primary text-[28px] font-bold text-green-dark">
          TiP
        </Link>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-10">
        <div className="text-center">
          <h1 className="font-primary text-[48px] italic text-green-dark">
            Reset your password
          </h1>
          <p className="mt-2 text-gray-text">
            We&apos;ll send you a verification code
          </p>
        </div>

        <div className="mt-8 w-[420px] overflow-hidden rounded-xl bg-white shadow-lg">
          {step === 'email' ? (
            <form onSubmit={handleSendCode} className="flex flex-col gap-6 p-8">
              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                disabled={isLoading}
                className="w-full rounded-lg border border-gray-200 px-4 py-3"
              />

              <button
                type="submit"
                disabled={isLoading}
                className="h-12 w-full rounded-lg bg-green-dark text-white disabled:opacity-50"
              >
                {isLoading ? 'Sending code...' : 'Send verification code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="flex flex-col gap-6 p-8">
              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Enter 6-digit code"
                required
                maxLength={6}
                disabled={isLoading}
                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-center"
              />

              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
                required
                disabled={isLoading}
                className="w-full rounded-lg border border-gray-200 px-4 py-3"
              />

              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                disabled={isLoading}
                className="w-full rounded-lg border border-gray-200 px-4 py-3"
              />

              <button
                type="submit"
                disabled={isLoading}
                className="h-12 w-full rounded-lg bg-green-dark text-white disabled:opacity-50"
              >
                {isLoading ? 'Resetting...' : 'Reset password'}
              </button>
            </form>
          )}

          <div className="border-t border-gray-100 bg-gray-50 px-8 py-4 text-center text-sm">
            <Link href="/sign-in" className="font-medium text-green-dark hover:underline">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
