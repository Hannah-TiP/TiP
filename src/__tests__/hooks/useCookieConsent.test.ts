import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCookieConsent } from '@/hooks/useCookieConsent';

const STORAGE_KEY = 'tip-cookie-consent';

// jsdom provides localStorage but Vitest may override it with a stub that
// lacks `.clear()`. Create a proper backing store.
const store: Record<string, string> = {};
const mockLocalStorage = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    store[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete store[key];
  }),
  clear: vi.fn(() => {
    for (const key of Object.keys(store)) delete store[key];
  }),
  get length() {
    return Object.keys(store).length;
  },
  key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
};

Object.defineProperty(globalThis, 'localStorage', { value: mockLocalStorage, writable: true });

describe('useCookieConsent', () => {
  beforeEach(() => {
    for (const key of Object.keys(store)) delete store[key];
    vi.clearAllMocks();
  });

  it('shows banner when no consent has been stored', () => {
    const { result } = renderHook(() => useCookieConsent());
    expect(result.current.showBanner).toBe(true);
    expect(result.current.analytics).toBe(false);
    expect(result.current.marketing).toBe(false);
  });

  it('hides banner and restores preferences from localStorage', () => {
    store[STORAGE_KEY] = JSON.stringify({
      analytics: true,
      marketing: false,
      timestamp: '2026-01-01T00:00:00Z',
    });

    const { result } = renderHook(() => useCookieConsent());
    expect(result.current.showBanner).toBe(false);
    expect(result.current.analytics).toBe(true);
    expect(result.current.marketing).toBe(false);
  });

  it('acceptAll sets both categories to true and hides banner', () => {
    const { result } = renderHook(() => useCookieConsent());
    expect(result.current.showBanner).toBe(true);

    act(() => {
      result.current.acceptAll();
    });

    expect(result.current.showBanner).toBe(false);
    expect(result.current.analytics).toBe(true);
    expect(result.current.marketing).toBe(true);

    const stored = JSON.parse(store[STORAGE_KEY]);
    expect(stored.analytics).toBe(true);
    expect(stored.marketing).toBe(true);
    expect(stored.timestamp).toBeDefined();
  });

  it('declineAll sets both categories to false and hides banner', () => {
    const { result } = renderHook(() => useCookieConsent());

    act(() => {
      result.current.declineAll();
    });

    expect(result.current.showBanner).toBe(false);
    expect(result.current.analytics).toBe(false);
    expect(result.current.marketing).toBe(false);

    const stored = JSON.parse(store[STORAGE_KEY]);
    expect(stored.analytics).toBe(false);
    expect(stored.marketing).toBe(false);
  });

  it('updatePreferences saves custom choices', () => {
    const { result } = renderHook(() => useCookieConsent());

    act(() => {
      result.current.updatePreferences({ analytics: true, marketing: false });
    });

    expect(result.current.showBanner).toBe(false);
    expect(result.current.analytics).toBe(true);
    expect(result.current.marketing).toBe(false);

    const stored = JSON.parse(store[STORAGE_KEY]);
    expect(stored.analytics).toBe(true);
    expect(stored.marketing).toBe(false);
  });

  it('fires cookie-consent-changed custom event on acceptAll', () => {
    const events: CustomEvent[] = [];
    const handler = (e: Event) => events.push(e as CustomEvent);
    window.addEventListener('cookie-consent-changed', handler);

    const { result } = renderHook(() => useCookieConsent());

    act(() => {
      result.current.acceptAll();
    });

    expect(events).toHaveLength(1);
    expect(events[0].detail.analytics).toBe(true);
    expect(events[0].detail.marketing).toBe(true);

    window.removeEventListener('cookie-consent-changed', handler);
  });

  it('ignores corrupted localStorage data and shows banner', () => {
    store[STORAGE_KEY] = 'not-valid-json';

    const { result } = renderHook(() => useCookieConsent());
    expect(result.current.showBanner).toBe(true);
    expect(result.current.analytics).toBe(false);
  });

  it('ignores localStorage data with missing fields', () => {
    store[STORAGE_KEY] = JSON.stringify({ analytics: true });

    const { result } = renderHook(() => useCookieConsent());
    expect(result.current.showBanner).toBe(true);
  });
});
