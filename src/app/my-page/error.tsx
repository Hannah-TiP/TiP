'use client';

import ErrorBoundaryCard from '@/components/ErrorBoundaryCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { useChunkErrorReload } from '@/hooks/useChunkErrorReload';

/**
 * My Page section error boundary. Scopes failures in the authed My Page
 * section so recovery is section-local — the rest of the app chrome stays
 * intact and `reset()` re-renders only this segment.
 */
export default function MyPageError({
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
      message={t('error.boundary_message_section')}
      onRetry={reset}
      retryLabel={t('error.try_again')}
      homeLabel={t('error.go_home')}
    />
  );
}
