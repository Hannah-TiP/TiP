/**
 * Google OAuth full-page redirect (auth-code) flow helpers.
 *
 * On iOS Safari (ITP on by default) the popup auth-code flow fails: the
 * popup opens in a separate tab and its postMessage back to the opener
 * (TiP) doesn't survive the cross-origin round-trip, so TiP never receives
 * the code. The fix is a top-level same-tab redirect to Google and back to
 * a TiP callback URL (`/auth/google/callback`) carrying `?code` (SMA-133).
 *
 * These helpers are pure (no React) so the sign-in/register pages and the
 * callback page can share them and the unit tests can hit every branch.
 */

const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';

/** Scopes the popup auth-code flow requested — kept identical. */
const GOOGLE_SCOPES = 'openid email profile';

/** Path on the current origin that Google redirects back to with `?code`. */
export const GOOGLE_CALLBACK_PATH = '/auth/google/callback';

/** sessionStorage key holding the CSRF nonce across the same-tab redirect. */
export const GOOGLE_NONCE_STORAGE_KEY = 'tip-google-oauth-nonce';

/** Where the user should be returned to after a successful sign-in. */
export interface GoogleOAuthState {
  /** Validated same-origin path to land on after auth (may be empty). */
  returnTo: string;
  /** Referral code threaded through the round-trip, or null. */
  ref: string | null;
  /** CSRF nonce — must match the value persisted in sessionStorage. */
  nonce: string;
  /** Originating page so the callback can route errors back ('sign-in'|'register'). */
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

export function encodeState(state: GoogleOAuthState): string {
  return base64UrlEncode(JSON.stringify(state));
}

/** Decode the `state` param; returns null on any malformed/missing value. */
export function decodeState(raw: string | null): GoogleOAuthState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(base64UrlDecode(raw)) as Partial<GoogleOAuthState>;
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

/** Build the top-level Google authorization URL for the redirect flow. */
export function buildGoogleAuthUrl(params: {
  clientId: string;
  redirectUri: string;
  state: string;
}): string {
  const query = new URLSearchParams({
    client_id: params.clientId,
    redirect_uri: params.redirectUri,
    response_type: 'code',
    scope: GOOGLE_SCOPES,
    state: params.state,
    // Always re-prompt account selection so a returning user can switch
    // accounts instead of being silently signed straight through.
    prompt: 'select_account',
  });
  return `${GOOGLE_AUTH_ENDPOINT}?${query.toString()}`;
}

/**
 * Start the full-page Google sign-in redirect from the current origin.
 *
 * Persists the CSRF nonce in sessionStorage (survives the same-tab
 * navigation), encodes the return/referral context into `state`, and
 * navigates the top-level window to Google.
 */
export function startGoogleRedirect(opts: {
  clientId: string;
  returnTo: string;
  ref: string | null;
  from: 'sign-in' | 'register';
}): void {
  const nonce = generateNonce();
  window.sessionStorage.setItem(GOOGLE_NONCE_STORAGE_KEY, nonce);

  const redirectUri = `${window.location.origin}${GOOGLE_CALLBACK_PATH}`;
  const state = encodeState({
    returnTo: opts.returnTo,
    ref: opts.ref,
    nonce,
    from: opts.from,
  });

  window.location.assign(buildGoogleAuthUrl({ clientId: opts.clientId, redirectUri, state }));
}
