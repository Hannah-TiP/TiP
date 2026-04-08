'use client';

const PREVIEW_SESSION_KEY = 'tip_preview_mode';

/**
 * Check if preview mode is enabled via environment variable.
 * Uses NEXT_PUBLIC_ prefix so it is available client-side.
 */
export function isPreviewModeAllowed(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_PREVIEW_MODE === 'true';
}

/**
 * Activate preview mode (stores in sessionStorage).
 * Only works if NEXT_PUBLIC_ENABLE_PREVIEW_MODE=true.
 */
export function activatePreviewMode(): void {
  if (!isPreviewModeAllowed()) return;
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(PREVIEW_SESSION_KEY, 'true');
  }
}

/**
 * Deactivate preview mode.
 */
export function deactivatePreviewMode(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(PREVIEW_SESSION_KEY);
  }
}

/**
 * Check if preview mode is currently active.
 * Returns true only if the env var allows it AND sessionStorage has the flag.
 */
export function isPreviewModeActive(): boolean {
  if (!isPreviewModeAllowed()) return false;
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(PREVIEW_SESSION_KEY) === 'true';
}

/**
 * Initialize preview mode from URL query param.
 * Call this on app load / navigation to detect ?preview=true.
 */
export function initPreviewModeFromUrl(): boolean {
  if (!isPreviewModeAllowed()) return false;
  if (typeof window === 'undefined') return false;

  const params = new URLSearchParams(window.location.search);
  if (params.get('preview') === 'true') {
    activatePreviewMode();
    return true;
  }
  return isPreviewModeActive();
}
