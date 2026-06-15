import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  GOOGLE_CALLBACK_PATH,
  GOOGLE_NONCE_STORAGE_KEY,
  buildGoogleAuthUrl,
  decodeState,
  encodeState,
  generateNonce,
  startGoogleRedirect,
} from '@/lib/google-oauth';

describe('google-oauth helpers', () => {
  describe('buildGoogleAuthUrl', () => {
    it('builds the Google authorization URL with the required query params', () => {
      const url = new URL(
        buildGoogleAuthUrl({
          clientId: 'client-123',
          redirectUri: 'https://app.test/auth/google/callback',
          state: 'encoded-state',
        }),
      );

      expect(`${url.origin}${url.pathname}`).toBe('https://accounts.google.com/o/oauth2/v2/auth');
      expect(url.searchParams.get('client_id')).toBe('client-123');
      expect(url.searchParams.get('redirect_uri')).toBe('https://app.test/auth/google/callback');
      expect(url.searchParams.get('response_type')).toBe('code');
      expect(url.searchParams.get('scope')).toBe('openid email profile');
      expect(url.searchParams.get('state')).toBe('encoded-state');
    });
  });

  describe('state encode/decode', () => {
    it('round-trips a state object', () => {
      const state = {
        returnTo: '/concierge?prefill=1',
        ref: 'ABC123',
        nonce: 'deadbeef',
        from: 'register' as const,
      };
      expect(decodeState(encodeState(state))).toEqual(state);
    });

    it('returns null for missing or malformed state', () => {
      expect(decodeState(null)).toBeNull();
      expect(decodeState('not-base64-json')).toBeNull();
    });

    it('rejects state without a nonce', () => {
      const raw = encodeState({
        returnTo: '/x',
        ref: null,
        nonce: '',
        from: 'sign-in',
      });
      expect(decodeState(raw)).toBeNull();
    });

    it('defaults an unknown `from` to sign-in', () => {
      const raw = btoa(JSON.stringify({ nonce: 'n', from: 'whatever' }))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
      expect(decodeState(raw)?.from).toBe('sign-in');
    });
  });

  describe('generateNonce', () => {
    it('returns a 32-char hex string', () => {
      expect(generateNonce()).toMatch(/^[0-9a-f]{32}$/);
    });
  });

  describe('startGoogleRedirect', () => {
    const assignMock = vi.fn();

    beforeEach(() => {
      window.sessionStorage.clear();
      assignMock.mockReset();
      vi.stubGlobal('location', {
        origin: 'https://app.test',
        assign: assignMock,
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('persists the nonce and navigates to Google with encoded state', () => {
      startGoogleRedirect({
        clientId: 'client-xyz',
        returnTo: '/my-page',
        ref: 'REF9',
        from: 'sign-in',
      });

      const nonce = window.sessionStorage.getItem(GOOGLE_NONCE_STORAGE_KEY);
      expect(nonce).toMatch(/^[0-9a-f]{32}$/);

      expect(assignMock).toHaveBeenCalledTimes(1);
      const url = new URL(assignMock.mock.calls[0][0] as string);
      expect(url.searchParams.get('client_id')).toBe('client-xyz');
      expect(url.searchParams.get('redirect_uri')).toBe(`https://app.test${GOOGLE_CALLBACK_PATH}`);

      const decoded = decodeState(url.searchParams.get('state'));
      expect(decoded).toMatchObject({
        returnTo: '/my-page',
        ref: 'REF9',
        from: 'sign-in',
        nonce,
      });
    });
  });
});
