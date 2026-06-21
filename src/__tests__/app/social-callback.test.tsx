import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SocialOAuthCallback from '@/components/auth/SocialOAuthCallback';
import enTranslations from '@/translations/en.json';
import { encodeState, nonceStorageKey } from '@/lib/social-oauth';

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

describe('SocialOAuthCallback', () => {
  it('exchanges the Naver code (forwarding state), signs in, and navigates to returnTo', async () => {
    const href = setHref();
    window.sessionStorage.setItem(nonceStorageKey('naver'), NONCE);
    const rawState = encodeState({
      returnTo: '/my-page/trip/7',
      ref: null,
      nonce: NONCE,
      from: 'sign-in',
    });
    searchParamsRef.current = new URLSearchParams({ code: 'naver-code', state: rawState });
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { access_token: 'at', refresh_token: 'rt' } }),
    });
    signInMock.mockResolvedValue({ error: undefined });
    getSessionMock.mockResolvedValue({ user: { onboarding_completed: true } });

    render(<SocialOAuthCallback provider="naver" />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/auth/social-login');
    // Naver requires the original state echoed back in the exchange.
    expect(JSON.parse(init.body as string)).toEqual({
      provider: 'naver',
      auth_code: 'naver-code',
      state: rawState,
    });

    await waitFor(() => expect(signInMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(href.value).toBe('/my-page/trip/7'));
    expect(window.sessionStorage.getItem(nonceStorageKey('naver'))).toBeNull();
  });

  it('routes new Kakao users through onboarding, threading ref + redirect', async () => {
    const href = setHref();
    window.sessionStorage.setItem(nonceStorageKey('kakao'), NONCE);
    searchParamsRef.current = new URLSearchParams({
      code: 'kakao-code',
      state: encodeState({ returnTo: '/concierge', ref: 'REF7', nonce: NONCE, from: 'register' }),
    });
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { access_token: 'at', refresh_token: 'rt' } }),
    });
    signInMock.mockResolvedValue({ error: undefined });
    getSessionMock.mockResolvedValue({ user: { onboarding_completed: false } });

    render(<SocialOAuthCallback provider="kakao" />);

    await waitFor(() => expect(href.value).toContain('/onboarding'));
    expect(href.value).toContain('ref=REF7');
    expect(href.value).toContain('redirect=%2Fconcierge');
  });

  it('shows an error and does not sign in on a CSRF nonce mismatch', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    window.sessionStorage.setItem(nonceStorageKey('kakao'), 'stored-nonce');
    searchParamsRef.current = new URLSearchParams({
      code: 'kakao-code',
      state: encodeState({
        returnTo: '/my-page',
        ref: null,
        nonce: 'different-nonce',
        from: 'sign-in',
      }),
    });

    render(<SocialOAuthCallback provider="kakao" />);

    expect(await screen.findByText(enTranslations['social_callback.error_failed'])).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(signInMock).not.toHaveBeenCalled();
    vi.advanceTimersByTime(2500);
    expect(replaceMock).toHaveBeenCalledWith('/sign-in');
  });

  it('shows a cancel message and returns to register on a provider error param', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    window.sessionStorage.setItem(nonceStorageKey('naver'), NONCE);
    searchParamsRef.current = new URLSearchParams({
      error: 'access_denied',
      state: encodeState({ returnTo: '/concierge', ref: null, nonce: NONCE, from: 'register' }),
    });

    render(<SocialOAuthCallback provider="naver" />);

    expect(await screen.findByText(enTranslations['social_callback.error_cancelled'])).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
    vi.advanceTimersByTime(2500);
    expect(replaceMock).toHaveBeenCalledWith('/register');
  });
});
