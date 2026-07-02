'use client';

import { useSyncExternalStore } from 'react';

/**
 * In-app webview detection (SMA-118).
 *
 * Google deliberately blocks OAuth inside embedded webviews
 * (`disallowed_useragent`) — most commonly hit in Korea via KakaoTalk's
 * in-app browser when the site is opened from a shared link. There is no
 * opt-out, so the sign-in / register pages detect the webview, hide the
 * Google login widget, and offer an escape hatch to a real browser.
 *
 * Detection is deliberately limited to an explicit allow-list of known
 * link-sharing apps. The generic Android webview token (`; wv)`) is NOT
 * used to gate Google login — it would risk false positives on embedded
 * browsers where Google login actually works.
 */

export type InAppBrowserOS = 'ios' | 'android' | 'other';

export interface InAppBrowserInfo {
  inApp: boolean;
  app?: string;
  os: InAppBrowserOS;
}

// Case-insensitive UA signatures for known in-app browsers. Order matters
// only for UAs carrying multiple tokens (first match wins).
const IN_APP_SIGNATURES: Array<{ app: string; pattern: RegExp }> = [
  { app: 'kakaotalk', pattern: /kakaotalk/i },
  // Naver app UAs end with e.g. `NAVER(inapp; search; 2000; 12.10.5)`.
  { app: 'naver', pattern: /naver\(|inapp; search/i },
  { app: 'instagram', pattern: /instagram/i },
  // Facebook app: `[FBAN/FBIOS;...]` on iOS, `[FB_IAB/FB4A;FBAV/...]` on Android.
  { app: 'facebook', pattern: /fban|fbav/i },
  // Line app appends ` Line/13.12.0`. Word boundary so e.g. "Outline/" can't match.
  { app: 'line', pattern: /\bline\//i },
  { app: 'daum', pattern: /daumapps/i },
];

/**
 * Pure UA-string classifier. Safe to call anywhere — with no argument it
 * reads `navigator.userAgent` and returns the negative result during SSR.
 */
export function detectInAppBrowser(ua?: string): InAppBrowserInfo {
  const userAgent = ua ?? (typeof navigator !== 'undefined' ? navigator.userAgent : '');
  if (!userAgent) return { inApp: false, os: 'other' };

  const os: InAppBrowserOS = /iphone|ipad|ipod/i.test(userAgent)
    ? 'ios'
    : /android/i.test(userAgent)
      ? 'android'
      : 'other';

  const match = IN_APP_SIGNATURES.find(({ pattern }) => pattern.test(userAgent));
  if (!match) return { inApp: false, os };
  return { inApp: true, app: match.app, os };
}

/**
 * `kakaotalk://web/openExternal` asks KakaoTalk to reopen the URL in the
 * system browser. Works on both Android and iOS KakaoTalk.
 */
export function buildKakaoExternalUrl(currentUrl: string): string {
  return `kakaotalk://web/openExternal?url=${encodeURIComponent(currentUrl)}`;
}

/**
 * Android Chrome intent URL — best-effort escape hatch for non-Kakao
 * Android webviews. Silently no-ops on webviews that block intent
 * navigation, which is why the copy-link fallback always renders too.
 */
export function buildAndroidIntentUrl(currentUrl: string): string {
  const { host, pathname, search } = new URL(currentUrl);
  return `intent://${host}${pathname}${search}#Intent;scheme=https;package=com.android.chrome;end`;
}

// useSyncExternalStore plumbing (same hydration-safe pattern as
// usePreviewMode). The UA never changes within a session, so the store
// never emits and the snapshot is computed once and cached — the snapshot
// must be referentially stable or React would re-render forever.
const SERVER_SNAPSHOT: InAppBrowserInfo = { inApp: false, os: 'other' };
let clientSnapshot: InAppBrowserInfo | null = null;

function subscribe(): () => void {
  return () => {};
}

function getSnapshot(): InAppBrowserInfo {
  if (!clientSnapshot) clientSnapshot = detectInAppBrowser();
  return clientSnapshot;
}

function getServerSnapshot(): InAppBrowserInfo {
  return SERVER_SNAPSHOT;
}

/**
 * Hydration-safe detection hook: the server render (and the hydration
 * pass) always report "not in app" so the first paint matches the server
 * HTML; the real detection result lands right after hydration.
 */
export function useInAppBrowser(): InAppBrowserInfo {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
