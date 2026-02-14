'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function RegisterPage() {
  const { register, sendVerificationCode } = useAuth();
  const [step, setStep] = useState<'email' | 'verify'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await sendVerificationCode(email, 'register');
      setStep('verify');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await register(email, password, verificationCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
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
            Create your account
          </h1>
          <p className="mt-2 text-gray-text">
            Start your journey with personalized travel planning
          </p>
        </div>

        <div className="mt-8 w-[420px] overflow-hidden rounded-xl bg-white shadow-lg">
          {step === 'email' ? (
            <form onSubmit={handleSendCode} className="flex flex-col gap-6 p-8">
              <h2 className="text-center text-[20px] font-semibold text-green-dark">
                Sign up
              </h2>

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

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                required
                disabled={isLoading}
                className="w-full rounded-lg border border-gray-200 px-4 py-3"
              />

              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
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
            <form onSubmit={handleRegister} className="flex flex-col gap-6 p-8">
              <h2 className="text-center text-[20px] font-semibold text-green-dark">
                Verify your email
              </h2>

              <p className="text-center text-sm text-gray-text">
                We sent a 6-digit code to <strong>{email}</strong>
              </p>

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
                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-center text-2xl tracking-widest"
              />

              <button
                type="submit"
                disabled={isLoading}
                className="h-12 w-full rounded-lg bg-green-dark text-white disabled:opacity-50"
              >
                {isLoading ? 'Creating account...' : 'Complete registration'}
              </button>

              <button
                type="button"
                onClick={() => setStep('email')}
                className="text-sm text-green-dark hover:underline"
              >
                Change email
              </button>
            </form>
          )}

          <div className="border-t border-gray-100 bg-gray-50 px-8 py-4 text-center text-sm">
            <span className="text-gray-text">Already have an account? </span>
            <Link href="/sign-in" className="font-medium text-green-dark hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
