/**
 * Language forwarding for the Next.js API proxy layer (SMA-260).
 *
 * Rule: forward, never invent. The `Language` request header is the FIRST and
 * winning rung of the backend's language ladder (header → stored
 * `language_preference` → `Accept-Language` → EN), so a proxy that hardcodes a
 * value silently overrides the user's saved preference. A proxy therefore
 * sends the `Language` header ONLY when its own caller supplied `?language=`;
 * when absent it sends NO header at all and lets the backend ladder resolve.
 */

/**
 * Build the `Language` header entry for a backend fetch from the proxy's own
 * request URL. Spread the result into the fetch `headers` object:
 *
 *   headers: { ...languageHeader(request) }
 *
 * Accepts a plain `Request` (reads `?language=` off `request.url`) so route
 * handlers and unit tests can pass either `Request` or `NextRequest`.
 */
export function languageHeader(request: Request): Record<string, string> {
  const language = new URL(request.url).searchParams.get('language');
  return language ? { Language: language } : {};
}
