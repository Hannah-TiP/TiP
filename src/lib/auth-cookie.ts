/**
 * Derives whether the Auth.js session cookie uses the `__Secure-` prefix.
 *
 * Mirrors Auth.js core's own derivation (next-auth `lib/env.js` `reqWithEnvURL`):
 * cookie security follows the AUTH_URL scheme, NOT NODE_ENV. This keeps a local
 * production build served over http://localhost readable (insecure cookie name)
 * while https deployments — including those behind TLS-terminating proxies where
 * the Node server sees plain-http requests — stay on `__Secure-authjs.session-token`.
 *
 * @param authUrl AUTH_URL (or NEXTAUTH_URL fallback) if set — takes precedence.
 * @param requestProtocol `request.nextUrl.protocol` (e.g. 'https:') — fallback only.
 */
export function isSecureAuthCookie(authUrl: string | undefined, requestProtocol: string): boolean {
  if (authUrl) {
    return authUrl.startsWith('https');
  }
  return requestProtocol === 'https:';
}
