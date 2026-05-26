'use client';

import { useState, useCallback, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'tip-cookie-consent';
const CONSENT_CHANGED_EVENT = 'cookie-consent-changed';

export interface CookiePreferences {
  analytics: boolean;
  marketing: boolean;
}

export interface CookieConsentState extends CookiePreferences {
  /** True when the user has not yet made a choice. */
  showBanner: boolean;
  /** Accept all optional categories. */
  acceptAll: () => void;
  /** Decline all optional categories (only necessary cookies). */
  declineAll: () => void;
  /** Set individual category preferences. */
  updatePreferences: (prefs: CookiePreferences) => void;
}

interface StoredConsent {
  analytics: boolean;
  marketing: boolean;
  /** ISO timestamp of when the user made a choice. */
  timestamp: string;
}

function readStored(): StoredConsent | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'analytics' in parsed &&
      'marketing' in parsed &&
      'timestamp' in parsed &&
      typeof (parsed as StoredConsent).analytics === 'boolean' &&
      typeof (parsed as StoredConsent).marketing === 'boolean' &&
      typeof (parsed as StoredConsent).timestamp === 'string'
    ) {
      return parsed as StoredConsent;
    }
    return null;
  } catch {
    return null;
  }
}

function writeStored(prefs: CookiePreferences): void {
  const stored: StoredConsent = {
    analytics: prefs.analytics,
    marketing: prefs.marketing,
    timestamp: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT, { detail: stored }));
}

// Subscribe / getSnapshot pair for useSyncExternalStore so we react to
// localStorage writes from other tabs or from writeStored() above.
function subscribe(callback: () => void): () => void {
  window.addEventListener('storage', callback);
  window.addEventListener(CONSENT_CHANGED_EVENT, callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(CONSENT_CHANGED_EVENT, callback);
  };
}

function getSnapshot(): string {
  return localStorage.getItem(STORAGE_KEY) ?? '';
}

function getServerSnapshot(): string {
  return '';
}

export function useCookieConsent(): CookieConsentState {
  // useSyncExternalStore triggers a re-render whenever the raw JSON changes.
  const rawSnapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Parse the snapshot. null means no consent stored yet.
  const stored = rawSnapshot ? readStored() : null;

  // If user dismissed the banner (consent stored), banner stays hidden.
  // showBanner starts hidden during SSR and on first client render if consent
  // exists. The `dismissed` state tracks whether the user acted this session
  // (before the external store snapshot updates on the same tick).
  const [dismissed, setDismissed] = useState(false);

  const hasConsent = stored !== null;
  const showBanner = !hasConsent && !dismissed;

  const analytics = stored?.analytics ?? false;
  const marketing = stored?.marketing ?? false;

  const acceptAll = useCallback(() => {
    writeStored({ analytics: true, marketing: true });
    setDismissed(true);
  }, []);

  const declineAll = useCallback(() => {
    writeStored({ analytics: false, marketing: false });
    setDismissed(true);
  }, []);

  const updatePreferences = useCallback((prefs: CookiePreferences) => {
    writeStored(prefs);
    setDismissed(true);
  }, []);

  return { analytics, marketing, showBanner, acceptAll, declineAll, updatePreferences };
}
