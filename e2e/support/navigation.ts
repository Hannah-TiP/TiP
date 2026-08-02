import { expect, type Page, type Response } from '@playwright/test';

/**
 * Combined selector for React 19's streaming markers:
 *
 *   - `template[id*="B:"]` — the Suspense boundary placeholder the SSR shell
 *     ships (`<!--$?--><template id="B:0"></template>`).
 *   - `[id*="S:"]`        — the hidden staging buffer (`<div hidden id="S:0">`)
 *     the real markup streams into before React splices it into the boundary.
 *
 * Verified against react-dom 19.2.3 server production build:
 * `segmentPrefix = idPrefix + "S:"`, `boundaryPrefix = idPrefix + "B:"`.
 * Substring (`*=`) matching is deliberate — a non-empty React
 * `identifierPrefix` would make a prefix (`^=`) selector silently match
 * nothing and turn the guard into a no-op.
 */
export const STREAMING_MARKER_SELECTOR = 'template[id*="B:"], [id*="S:"]';

/**
 * Drop-in replacement for `page.goto` that waits out React's streaming reveal.
 *
 * Every page wrapped in a page-level `<Suspense>` (e.g. /signature-journeys,
 * /dream-hotels, /more-dreams, /magazine, /concierge) is streamed by a
 * production build: the shell ships `<!--$?--><template id="B:0"></template>`,
 * the real markup arrives later inside a `<div hidden id="S:0">` buffer, and
 * React splices that buffer into the boundary on a THROTTLED timer (~300 ms
 * after first paint, pinned to at most ~2300 ms). React force-client-renders
 * the boundary as soon as it hydrates, so between hydration and that splice
 * the document holds two copies of the page — the live one plus the
 * not-yet-consumed hidden buffer — and every page-level test id resolves to
 * 2 elements. `page.goto` resolves on `load`, which on a loaded CI runner
 * lands inside that window (the SMA-247 `e2e-pr-smoke` failure), so any
 * strict-mode locator hit immediately after a bare `page.goto` can flake with
 * "resolved to 2 elements".
 *
 * The wait targets BOTH markers so it cannot pass vacuously: with an early
 * `waitUntil` (e.g. `domcontentloaded` on a slow stream) the `S:` staging node
 * may not exist YET — waiting on it alone would resolve instantly and the
 * duplicate would still appear afterwards. The `B:` boundary template closes
 * that window: it is present from the shell onward and only disappears when
 * React consumes the boundary. Waiting for both to be ABSENT is still the
 * narrowest possible guard — it only tolerates React's own streaming
 * scaffolding, so a genuine double render (two LIVE copies) trips strict mode
 * exactly as before. On non-streaming pages (and non-HTML responses like
 * /sitemap.xml) the selector resolves to 0 immediately and the wait is a
 * no-op.
 *
 * `e2e/streaming-reveal-guard.spec.ts` proves the buffer is genuinely
 * observed at least once, so a React marker-scheme change goes red there
 * instead of silently degrading this guard.
 */
export async function gotoPage(
  page: Page,
  path: string,
  options?: Parameters<Page['goto']>[1],
): Promise<Response | null> {
  const response = await page.goto(path, options);
  await expect(
    page.locator(STREAMING_MARKER_SELECTOR),
    `React streaming markers (${STREAMING_MARKER_SELECTOR}) never cleared — ` +
      'a Suspense boundary did not resolve within 5s',
  ).toHaveCount(0, { timeout: 5_000 });
  return response;
}
