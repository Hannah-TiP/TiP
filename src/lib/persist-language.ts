import type { Lang } from '@/contexts/LanguageContext';
import { apiClient } from '@/lib/api-client';

/**
 * Apply a UI-language toggle and persist it appropriately.
 *
 * - `setLang(next)` always runs (localStorage persistence for everyone).
 * - When `isAuthenticated`, the choice is ALSO persisted to the user's account
 *   via `POST /api/v2/auth/me` so the backend's request-language resolution and
 *   transactional emails follow the chosen UI language.
 *
 * The account write is best-effort and fire-and-forget — a failure logs but
 * never blocks or reverts the local toggle, and anonymous users never call the
 * API.
 */
export function applyLanguageToggle(
  next: Lang,
  setLang: (lang: Lang) => void,
  isAuthenticated: boolean,
): void {
  setLang(next);
  if (isAuthenticated) {
    apiClient.updateLanguagePreference(next).catch((error) => {
      console.error('Failed to persist language preference:', error);
    });
  }
}
