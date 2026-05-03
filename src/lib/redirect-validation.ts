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
