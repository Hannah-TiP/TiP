'use client';

import Link from 'next/link';

interface ErrorBoundaryCardProps {
  title: string;
  message: string;
  onRetry: () => void;
  retryLabel: string;
  showHome?: boolean;
  homeLabel?: string;
}

/**
 * Branded presentational card shared by the App-Router error boundaries
 * (`error.tsx`, `my-page/error.tsx`). The app chrome (Header) stays from the
 * layout; this mirrors the `hotel/[id]/not-found.tsx` look. Presentational
 * only — copy + the retry callback are passed in so each boundary owns its
 * i18n + `reset()` wiring.
 */
export default function ErrorBoundaryCard({
  title,
  message,
  onRetry,
  retryLabel,
  showHome = true,
  homeLabel,
}: ErrorBoundaryCardProps) {
  return (
    <main className="min-h-screen bg-background">
      <div className="flex flex-col items-center justify-center px-4 py-40 text-center">
        <h1 className="font-primary text-[42px] italic text-green-dark">{title}</h1>
        <p className="mt-4 max-w-md text-gray-text">{message}</p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onRetry}
            className="rounded-full bg-green-dark px-8 py-3 text-[13px] font-semibold text-white hover:bg-green-dark/90"
          >
            {retryLabel}
          </button>
          {showHome && homeLabel ? (
            <Link
              href="/"
              className="rounded-full border border-green-dark px-8 py-3 text-[13px] font-semibold text-green-dark hover:bg-green-dark/5"
            >
              {homeLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </main>
  );
}
