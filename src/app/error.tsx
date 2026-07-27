'use client';

import ErrorBoundaryCard from '@/components/ErrorBoundaryCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { useChunkErrorReload } from '@/hooks/useChunkErrorReload';

/**
 * App-root error boundary. Catches page-level errors across all segments that
 * lack their own boundary. Renders INSIDE the root layout (Header stays
 * intact) — it does NOT catch root-layout errors (that's `global-error.tsx`).
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLanguage();
  useChunkErrorReload(error);

  return (
    <ErrorBoundaryCard
      title={t('error.boundary_title')}
      message={t('error.boundary_message')}
      onRetry={reset}
      retryLabel={t('error.try_again')}
      homeLabel={t('error.go_home')}
    />
  );
}
