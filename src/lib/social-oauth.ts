/**
 * Provider-parameterized social-OAuth full-page redirect (auth-code) helpers.
 *
 * Kakao and Naver mirror the Google redirect flow (SMA-133): a top-level
 * same-tab redirect to the provider and back to a TiP callback URL carrying
 * `?code` (+ `?state`). The same-tab redirect avoids the iOS-Safari
 * popup-postMessage failure and works without third-party cookies.
 *
 * The CSRF nonce + state encoding utilities here are intentionally identical
 * to (and a generalization of) the Google helpers — they are kept in one
 * place so the crypto is never copy-pasted (SMA-114). Google keeps its own
 * dedicated module for backward-compatibility; Kakao/Naver share this one.
 *
 * These helpers are pure (no React) so the sign-in/register pages, the modal,
 * and the callback pages can share them and the unit tests can hit every
 * branch.
 */

/** Social providers that use this shared redirect helper. */
export type SocialProvider = 'kakao' | 'naver';

interface ProviderConfig {
  /** The provider's OAuth authorization endpoint. */
  authEndpoint: string;
  /** Space-delimited scopes requested. Empty = provider default. */
  scope: string;
  /** sessionStorage key holding the CSRF nonce across the redirect. */
  nonceStorageKey: string;
}

const PROVIDER_CONFIG: Record<SocialProvider, ProviderConfig> = {
  kakao: {
    authEndpoint: 'https://kauth.kakao.com/oauth/authorize',
    // Email is an optional Kakao scope; request it so the backend can resolve
    // a verified email (a missing email is rejected — see AC8).
    scope: 'account_email',
    nonceStorageKey: 'tip-kakao-oauth-nonce',
  },
  naver: {
    authEndpoint: 'https://nid.naver.com/oauth2.0/authorize',
    scope: '',
    nonceStorageKey: 'tip-naver-oauth-nonce',
  },
};

/** Path on the current origin that the provider redirects back to with `?code`. */
export function callbackPath(provider: SocialProvider): string {
  return `/auth/${provider}/callback`;
}

/** sessionStorage key holding the CSRF nonce for a provider. */
export function nonceStorageKey(provider: SocialProvider): string {
  return PROVIDER_CONFIG[provider].nonceStorageKey;
}

/** Where the user should be returned to after a successful sign-in. */
export interface SocialOAuthState {
  /** Validated same-origin path to land on after auth (may be empty). */
  returnTo: string;
  /** Referral code threaded through the round-trip, or null. */
  ref: string | null;
  /** CSRF nonce — must match the value persisted in sessionStorage. */
  nonce: string;
  /** Originating page so the callback can route errors back. */
  from: 'sign-in' | 'register';
}

function base64UrlEncode(input: string): string {
  const base64 = btoa(unescape(encodeURIComponent(input)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(input: string): string {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  return decodeURIComponent(escape(atob(padded)));
}

/** Cryptographically-random hex nonce (CSRF token). */
export function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function encodeState(state: SocialOAuthState): string {
  return base64UrlEncode(JSON.stringify(state));
}

/** Decode the `state` param; returns null on any malformed/missing value. */
export function decodeState(raw: string | null): SocialOAuthState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(base64UrlDecode(raw)) as Partial<SocialOAuthState>;
    if (typeof parsed.nonce !== 'string' || parsed.nonce.length === 0) return null;
    const from = parsed.from === 'register' ? 'register' : 'sign-in';
    return {
      returnTo: typeof parsed.returnTo === 'string' ? parsed.returnTo : '',
      ref: typeof parsed.ref === 'string' && parsed.ref.length > 0 ? parsed.ref : null,
      nonce: parsed.nonce,
      from,
    };
  } catch {
    return null;
  }
}

/** Build the top-level provider authorization URL for the redirect flow. */
export function buildSocialAuthUrl(params: {
  provider: SocialProvider;
  clientId: string;
  redirectUri: string;
  state: string;
}): string {
  const config = PROVIDER_CONFIG[params.provider];
  const query = new URLSearchParams({
    client_id: params.clientId,
    redirect_uri: params.redirectUri,
    response_type: 'code',
    state: params.state,
  });
  if (config.scope) query.set('scope', config.scope);
  return `${config.authEndpoint}?${query.toString()}`;
}

/**
 * Start the full-page provider sign-in redirect from the current origin.
 *
 * Persists the CSRF nonce in sessionStorage (survives the same-tab
 * navigation), encodes the return/referral context into `state`, and
 * navigates the top-level window to the provider.
 */
export function startSocialRedirect(opts: {
  provider: SocialProvider;
  clientId: string;
  returnTo: string;
  ref: string | null;
  from: 'sign-in' | 'register';
}): void {
  const nonce = generateNonce();
  window.sessionStorage.setItem(nonceStorageKey(opts.provider), nonce);

  const redirectUri = `${window.location.origin}${callbackPath(opts.provider)}`;
  const state = encodeState({
    returnTo: opts.returnTo,
    ref: opts.ref,
    nonce,
    from: opts.from,
  });

  window.location.assign(
    buildSocialAuthUrl({
      provider: opts.provider,
      clientId: opts.clientId,
      redirectUri,
      state,
    }),
  );
}
