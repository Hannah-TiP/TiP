import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import GoogleCallbackPage from '@/app/auth/google/callback/page';
import enTranslations from '@/translations/en.json';
import { GOOGLE_NONCE_STORAGE_KEY, encodeState } from '@/lib/google-oauth';

const { replaceMock, signInMock, getSessionMock, searchParamsRef } = vi.hoisted(() => ({
  replaceMock: vi.fn(),
  signInMock: vi.fn(),
  getSessionMock: vi.fn(),
  searchParamsRef: { current: new URLSearchParams() },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: replaceMock, push: vi.fn() }),
  useSearchParams: () => searchParamsRef.current,
}));

vi.mock('next-auth/react', () => ({
  signIn: signInMock,
  getSession: getSessionMock,
}));

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => (enTranslations as Record<string, string>)[key] ?? key,
    lang: 'en',
    setLang: () => {},
  }),
}));

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

function setHref() {
  const href = { value: '' };
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: {
      get href() {
        return href.value;
      },
      set href(v: string) {
        href.value = v;
      },
    },
  });
  return href;
}

const NONCE = 'a'.repeat(32);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.useRealTimers();
  window.sessionStorage.clear();
});

describe('GoogleCallbackPage', () => {
  it('exchanges the code, signs in, and navigates to returnTo on success', async () => {
    const href = setHref();
    window.sessionStorage.setItem(GOOGLE_NONCE_STORAGE_KEY, NONCE);
    searchParamsRef.current = new URLSearchParams({
      code: 'auth-code-1',
      state: encodeState({
        returnTo: '/my-page/trip/7',
        ref: null,
        nonce: NONCE,
        from: 'sign-in',
      }),
    });
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { access_token: 'at', refresh_token: 'rt' } }),
    });
    signInMock.mockResolvedValue({ error: undefined });
    getSessionMock.mockResolvedValue({ user: { onboarding_completed: true } });

    render(<GoogleCallbackPage />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/auth/social-login');
    expect(JSON.parse(init.body as string)).toEqual({
      provider: 'google',
      auth_code: 'auth-code-1',
    });

    await waitFor(() => expect(signInMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(href.value).toBe('/my-page/trip/7'));
    // The single-use nonce must be cleared after the round-trip.
    expect(window.sessionStorage.getItem(GOOGLE_NONCE_STORAGE_KEY)).toBeNull();
  });

  it('routes new users through onboarding, threading ref + redirect', async () => {
    const href = setHref();
    window.sessionStorage.setItem(GOOGLE_NONCE_STORAGE_KEY, NONCE);
    searchParamsRef.current = new URLSearchParams({
      code: 'auth-code-2',
      state: encodeState({
        returnTo: '/concierge',
        ref: 'REF7',
        nonce: NONCE,
        from: 'register',
      }),
    });
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { access_token: 'at', refresh_token: 'rt' } }),
    });
    signInMock.mockResolvedValue({ error: undefined });
    getSessionMock.mockResolvedValue({ user: { onboarding_completed: false } });

    render(<GoogleCallbackPage />);

    await waitFor(() => expect(href.value).toContain('/onboarding'));
    expect(href.value).toContain('ref=REF7');
    expect(href.value).toContain('redirect=%2Fconcierge');
  });

  it('shows an error and does not sign in on a CSRF nonce mismatch', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    window.sessionStorage.setItem(GOOGLE_NONCE_STORAGE_KEY, 'stored-nonce');
    searchParamsRef.current = new URLSearchParams({
      code: 'auth-code-3',
      state: encodeState({
        returnTo: '/my-page',
        ref: null,
        nonce: 'different-nonce',
        from: 'sign-in',
      }),
    });

    render(<GoogleCallbackPage />);

    expect(await screen.findByText(enTranslations['google_callback.error_failed'])).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(signInMock).not.toHaveBeenCalled();
    // Falls back to the originating page after the delay.
    vi.advanceTimersByTime(2500);
    expect(replaceMock).toHaveBeenCalledWith('/sign-in');
  });

  it('shows a cancel message and returns to register on a Google error param', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    window.sessionStorage.setItem(GOOGLE_NONCE_STORAGE_KEY, NONCE);
    searchParamsRef.current = new URLSearchParams({
      error: 'access_denied',
      state: encodeState({
        returnTo: '/concierge',
        ref: null,
        nonce: NONCE,
        from: 'register',
      }),
    });

    render(<GoogleCallbackPage />);

    expect(await screen.findByText(enTranslations['auth.error_google_cancelled'])).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
    vi.advanceTimersByTime(2500);
    expect(replaceMock).toHaveBeenCalledWith('/register');
  });
});
