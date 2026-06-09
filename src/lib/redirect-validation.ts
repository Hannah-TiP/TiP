/**
 * Guard for sign-in / post-auth redirect targets.
 *
 * Accept ONLY same-origin relative paths so a crafted query string can't
 * bounce the user off-site after authentication. Concretely the value must:
 *   - be a non-empty string,
 *   - start with a single forward slash,
 *   - NOT start with `//` (protocol-relative URL → external),
 *   - NOT start with `/\` (Edge/IE legacy treats `/\evil.com` like `//evil.com`),
 *   - NOT contain a scheme (`http:`, `javascript:`, `data:`, etc.),
 *   - NOT contain control characters / whitespace that could be used to
 *     smuggle a different URL past the prefix check.
 *
 * Pulled out as a pure function so the unit tests can hit every branch
 * without spinning up the React tree.
 */
export function isSafeRedirectPath(value: string): boolean {
  if (typeof value !== 'string' || value.length === 0) return false;

  // Reject any control characters or whitespace anywhere in the value —
  // browsers strip some of these silently which lets attackers smuggle
  // values like `/\tjavascript:alert(1)`.
  if (/[\x00-\x1f\x7f\s]/.test(value)) return false;

  // Must start with a single `/`.
  if (value[0] !== '/') return false;

  // Reject protocol-relative (`//evil.com`) and the IE-style backslash
  // variant (`/\evil.com`).
  if (value[1] === '/' || value[1] === '\\') return false;

  // Defence in depth: even though the prefix check above forbids absolute
  // URLs, double-check there's no scheme anywhere (handles odd inputs that
  // somehow start with `/` but contain `http://...` after).
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value)) return false;

  return true;
}

/**
 * Build an auth-chain target URL (`/register`, `/onboarding`, …) that threads
 * the `ref` (referral) and `redirect` (post-auth destination) params through
 * to the next step in the sign-up → onboarding flow.
 *
 * Uses `URLSearchParams` so the `redirect` value — which is itself a URL with
 * its own query string (e.g. `/concierge?prefill=1&cityId=7`) — is encoded
 * exactly once and never collides with `ref`. Reading it back with
 * `searchParams.get('redirect')` auto-decodes it.
 *
 * `redirect` is dropped unless it passes `isSafeRedirectPath`, so an
 * external/crafted value can never ride the chain. Empty params are omitted.
 */
export function buildAuthRedirectUrl(
  base: string,
  params: { ref?: string; redirect?: string },
): string {
  const search = new URLSearchParams();
  if (params.ref) search.set('ref', params.ref);
  if (params.redirect && isSafeRedirectPath(params.redirect)) {
    search.set('redirect', params.redirect);
  }
  const query = search.toString();
  return query ? `${base}?${query}` : base;
}
