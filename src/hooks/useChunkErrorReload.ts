'use client';

import { useEffect } from 'react';
import { clearChunkReloadGuard, handleChunkReload } from '@/lib/chunk-reload';

/**
 * On mount, auto-reload once when `error` is a chunk-load failure (guarded
 * against reload loops), and clear the loop guard otherwise so the recovered
 * mount re-arms the reload for a future chunk error.
 *
 * Shared by the App-Router error boundaries (`error.tsx`, `my-page/error.tsx`).
 * `global-error.tsx` inlines the same logic to stay provider/hook-free.
 */
export function useChunkErrorReload(error: { name?: string; message?: string }): void {
  useEffect(() => {
    const reloading = handleChunkReload(error);
    if (!reloading) {
      clearChunkReloadGuard();
    }
  }, [error]);
}
