'use client';

import { usePreviewMode } from '@/hooks/usePreviewMode';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * A sticky banner shown at the top of the page when preview mode is active.
 * Allows testers to see they are in preview mode and toggle it off.
 */
export default function PreviewBanner() {
  const { isPreview, toggle } = usePreviewMode();
  const { t } = useLanguage();

  if (!isPreview) return null;

  return (
    <div className="fixed left-0 right-0 top-0 z-[9999] flex items-center justify-center gap-4 bg-amber-500 px-4 py-2 text-[13px] font-semibold text-white shadow-md">
      <span>{t('preview.mode_banner')}</span>
      <button
        onClick={toggle}
        className="rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold tracking-wide transition-colors hover:bg-white/30"
      >
        {t('preview.exit')}
      </button>
    </div>
  );
}
