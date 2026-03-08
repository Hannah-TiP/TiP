'use client';

import { Suspense, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { getDeviceId } from '@/lib/device';
import Image from 'next/image';
import Link from 'next/link';
import { GoogleOAuthProvider, GoogleLogin, CredentialResponse } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

function SignInForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const redirectTo = searchParams.get('redirect') || '/my-page';

  const handleGoogleSuccess = async (response: CredentialResponse) => {
    if (!response.credential) return;
    setError('');
    setIsLoading(true);

    try {
      const device_id = await getDeviceId();

      // Send Google token to backend via proxy
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
        throw new Error(data.message || 'Google sign-in failed');
      }

      const { data } = await res.json();

      // Establish NextAuth session using the social-login provider
      const result = await signIn('social-login', {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        device_id,
        redirect: false,
      });

      if (result?.error) {
        throw new Error('Failed to establish session');
      }

      window.location.href = redirectTo;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed');
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const device_id = await getDeviceId();
      const result = await signIn('credentials', {
        email,
        password,
        device_id,
        redirect: false,
      });
      if (result?.error) {
        setError('Invalid email or password');
      } else {
        window.location.href = redirectTo;
      }
    } catch {
      setError('Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-8 w-[420px] overflow-hidden rounded-xl bg-white shadow-lg">
      <div className="flex flex-col gap-6 p-8">
        <h2 className="text-center text-[20px] font-semibold text-green-dark">Welcome back</h2>

        {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

        {GOOGLE_CLIENT_ID && (
          <>
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google sign-in failed')}
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

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            disabled={isLoading}
            className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-green-dark"
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            disabled={isLoading}
            className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-green-dark"
          />

          <Link href="/forgot-password" className="text-sm text-green-dark hover:underline">
            Forgot password?
          </Link>

          <button
            type="submit"
            disabled={isLoading}
            className="flex h-12 w-full items-center justify-center rounded-lg bg-green-dark text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isLoading ? 'Signing in...' : 'Continue'}
          </button>
        </form>
      </div>

      <div className="border-t border-gray-100 bg-gray-50 px-8 py-4 text-center text-sm">
        <span className="text-gray-text">Don&apos;t have an account? </span>
        <Link href="/register" className="font-medium text-green-dark hover:underline">
          Sign up
        </Link>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <main className="flex min-h-screen flex-col bg-gray-light">
        {/* Top Bar */}
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
            <h1 className="font-primary text-[48px] italic text-green-dark">
              Sign in to start planning
            </h1>
            <p className="mt-2 text-gray-text">Access your personalized travel recommendations</p>
          </div>

          <Suspense
            fallback={<div className="mt-8 h-64 w-[420px] animate-pulse rounded-xl bg-white" />}
          >
            <SignInForm />
          </Suspense>
        </div>
      </main>
    </GoogleOAuthProvider>
  );
}
