'use client';

import { Suspense, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getDeviceId } from '@/lib/device';
import Link from 'next/link';

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
        router.push(searchParams.get('redirect') || '/my-page');
      }
    } catch {
      setError('Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-8 w-[420px] overflow-hidden rounded-xl bg-white shadow-lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-8">
        <h2 className="text-center text-[20px] font-semibold text-green-dark">
          Welcome back
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

        <Link
          href="/forgot-password"
          className="text-sm text-green-dark hover:underline"
        >
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
    <main className="flex min-h-screen flex-col bg-gray-light">
      {/* Top Bar */}
      <div className="flex h-14 items-center justify-between border-b border-gray-border bg-white px-10">
        <Link href="/" className="font-primary text-[28px] font-bold text-green-dark">
          TiP
        </Link>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-10">
        <div className="text-center">
          <h1 className="font-primary text-[48px] italic text-green-dark">
            Sign in to start planning
          </h1>
          <p className="mt-2 text-gray-text">
            Access your personalized travel recommendations
          </p>
        </div>

        <Suspense fallback={<div className="mt-8 h-64 w-[420px] animate-pulse rounded-xl bg-white" />}>
          <SignInForm />
        </Suspense>
      </div>
    </main>
  );
}
