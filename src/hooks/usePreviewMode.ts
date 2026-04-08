'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  isPreviewModeAllowed,
  isPreviewModeActive,
  activatePreviewMode,
  deactivatePreviewMode,
} from '@/lib/preview-mode';

// Simple external store for preview mode state
let listeners: Array<() => void> = [];

function subscribe(listener: () => void): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function emitChange(): void {
  for (const listener of listeners) {
    listener();
  }
}

function getSnapshot(): boolean {
  return isPreviewModeAllowed() && isPreviewModeActive();
}

function getServerSnapshot(): boolean {
  return false;
}

/**
 * React hook for preview mode state.
 * Automatically detects ?preview=true in URL and persists via sessionStorage.
 */
export function usePreviewMode(): {
  isPreview: boolean;
  isAllowed: boolean;
  toggle: () => void;
} {
  const searchParams = useSearchParams();

  // Activate preview if ?preview=true is present (runs synchronously during render)
  if (
    typeof window !== 'undefined' &&
    isPreviewModeAllowed() &&
    searchParams.get('preview') === 'true' &&
    !isPreviewModeActive()
  ) {
    activatePreviewMode();
  }

  const isPreview = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const isAllowed = isPreviewModeAllowed();

  const toggle = useCallback(() => {
    if (!isPreviewModeAllowed()) return;
    if (isPreviewModeActive()) {
      deactivatePreviewMode();
    } else {
      activatePreviewMode();
    }
    emitChange();
  }, []);

  return { isPreview, isAllowed, toggle };
}
