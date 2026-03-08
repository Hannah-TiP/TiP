'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { getDeviceId } from '@/lib/device';
import Image from 'next/image';
import Link from 'next/link';
import { GoogleOAuthProvider, GoogleLogin, CredentialResponse } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

function RegisterForm() {
  const [step, setStep] = useState<'email' | 'verify'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSuccess = async (response: CredentialResponse) => {
    if (!response.credential) return;
    setError('');
    setIsLoading(true);

    try {
      const device_id = await getDeviceId();

      const res = await fetch('/api/auth/social-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'google',
          id_token: response.credential,
          device_id,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Google sign-up failed');
      }

      const { data } = await res.json();

      const result = await signIn('social-login', {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        device_id,
        redirect: false,
      });

      if (result?.error) {
        throw new Error('Failed to establish session');
      }

      window.location.href = '/my-page';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-up failed');
      setIsLoading(false);
    }
  };

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
      const res = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code_type: 'register' }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to send verification code');
      }
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
      const device_id = await getDeviceId();

      // Step 1: Verify email-device binding
      const verifyRes = await fetch('/api/auth/verify-email-device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          device_id,
          verification_code: verificationCode,
          code_type: 'register',
        }),
      });
      if (!verifyRes.ok) {
        const data = await verifyRes.json();
        throw new Error(data.message || 'Invalid verification code');
      }

      // Step 2: Register via backend
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, device_id, verification_code: verificationCode }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Registration failed');
      }

      // Step 3: Sign in via NextAuth to establish the session
      const result = await signIn('credentials', {
        email,
        password,
        device_id,
        redirect: false,
      });
      if (result?.error) throw new Error('Failed to sign in after registration');

      window.location.href = '/my-page';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-8 w-[420px] overflow-hidden rounded-xl bg-white shadow-lg">
      {step === 'email' ? (
        <div className="flex flex-col gap-6 p-8">
          <h2 className="text-center text-[20px] font-semibold text-green-dark">Sign up</h2>

          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

          {GOOGLE_CLIENT_ID && (
            <>
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google sign-up failed')}
                  size="large"
                  width="356"
                  text="continue_with"
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-xs text-gray-text">or</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>
            </>
          )}

          <form onSubmit={handleSendCode} className="flex flex-col gap-6">
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
        </div>
      ) : (
        <form onSubmit={handleRegister} className="flex flex-col gap-6 p-8">
          <h2 className="text-center text-[20px] font-semibold text-green-dark">
            Verify your email
          </h2>

          <p className="text-center text-sm text-gray-text">
            We sent a 6-digit code to <strong>{email}</strong>
          </p>

          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

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
  );
}

export default function RegisterPage() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <main className="flex min-h-screen flex-col bg-gray-light">
        <div className="flex h-14 items-center justify-between border-b border-gray-border bg-white px-10">
          <Link href="/">
            <Image
              src="/bible_TIP_profil_400x400px.svg"
              alt="TiP"
              className="h-9"
              width={36}
              height={36}
            />
          </Link>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center px-10">
          <div className="text-center">
            <h1 className="font-primary text-[48px] italic text-green-dark">Create your account</h1>
            <p className="mt-2 text-gray-text">
              Start your journey with personalized travel planning
            </p>
          </div>

          <RegisterForm />
        </div>
      </main>
    </GoogleOAuthProvider>
  );
}
