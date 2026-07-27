import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildSocialAuthUrl,
  callbackPath,
  decodeState,
  encodeState,
  generateNonce,
  nonceStorageKey,
  startSocialRedirect,
} from '@/lib/social-oauth';

describe('social-oauth helpers', () => {
  describe('buildSocialAuthUrl', () => {
    it('builds the Kakao authorization URL with the email scope', () => {
      const url = new URL(
        buildSocialAuthUrl({
          provider: 'kakao',
          clientId: 'kakao-key',
          redirectUri: 'https://app.test/auth/kakao/callback',
          state: 'encoded-state',
        }),
      );

      expect(`${url.origin}${url.pathname}`).toBe('https://kauth.kakao.com/oauth/authorize');
      expect(url.searchParams.get('client_id')).toBe('kakao-key');
      expect(url.searchParams.get('redirect_uri')).toBe('https://app.test/auth/kakao/callback');
      expect(url.searchParams.get('response_type')).toBe('code');
      expect(url.searchParams.get('scope')).toBe('account_email');
      expect(url.searchParams.get('state')).toBe('encoded-state');
    });

    it('builds the Naver authorization URL without a scope param', () => {
      const url = new URL(
        buildSocialAuthUrl({
          provider: 'naver',
          clientId: 'naver-id',
          redirectUri: 'https://app.test/auth/naver/callback',
          state: 'enc',
        }),
      );

      expect(`${url.origin}${url.pathname}`).toBe('https://nid.naver.com/oauth2.0/authorize');
      expect(url.searchParams.get('client_id')).toBe('naver-id');
      expect(url.searchParams.get('response_type')).toBe('code');
      expect(url.searchParams.has('scope')).toBe(false);
    });
  });

  describe('provider paths + keys', () => {
    it('derives callback paths and distinct nonce keys per provider', () => {
      expect(callbackPath('kakao')).toBe('/auth/kakao/callback');
      expect(callbackPath('naver')).toBe('/auth/naver/callback');
      expect(nonceStorageKey('kakao')).not.toBe(nonceStorageKey('naver'));
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
      const raw = encodeState({ returnTo: '/x', ref: null, nonce: '', from: 'sign-in' });
      expect(decodeState(raw)).toBeNull();
    });
  });

  describe('generateNonce', () => {
    it('returns a 32-char hex string', () => {
      expect(generateNonce()).toMatch(/^[0-9a-f]{32}$/);
    });
  });

  describe('startSocialRedirect', () => {
    const assignMock = vi.fn();

    beforeEach(() => {
      window.sessionStorage.clear();
      assignMock.mockReset();
      vi.stubGlobal('location', { origin: 'https://app.test', assign: assignMock });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('persists the nonce under the provider key and navigates with encoded state', () => {
      startSocialRedirect({
        provider: 'naver',
        clientId: 'naver-id',
        returnTo: '/my-page',
        ref: 'REF9',
        from: 'sign-in',
      });

      const nonce = window.sessionStorage.getItem(nonceStorageKey('naver'));
      expect(nonce).toMatch(/^[0-9a-f]{32}$/);
      // The Kakao key must remain untouched (distinct CSRF tokens).
      expect(window.sessionStorage.getItem(nonceStorageKey('kakao'))).toBeNull();

      expect(assignMock).toHaveBeenCalledTimes(1);
      const url = new URL(assignMock.mock.calls[0][0] as string);
      expect(url.searchParams.get('client_id')).toBe('naver-id');
      expect(url.searchParams.get('redirect_uri')).toBe('https://app.test/auth/naver/callback');

      expect(decodeState(url.searchParams.get('state'))).toMatchObject({
        returnTo: '/my-page',
        ref: 'REF9',
        from: 'sign-in',
        nonce,
      });
    });
  });
});
