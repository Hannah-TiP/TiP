import { test, expect } from '@playwright/test';
import { gotoPage, STREAMING_MARKER_SELECTOR } from './support/navigation';

/**
 * Guard-integrity check for the shared `gotoPage` navigation helper
 * (e2e/support/navigation.ts).
 *
 * `gotoPage` waits for React's streaming markers (`template[id*="B:"]` and
 * `[id*="S:"]`) to be ABSENT before returning. That wait is only meaningful if
 * the markers actually exist in the DOM during a streamed navigation — if
 * React renamed its marker scheme, the selector would resolve to 0
 * immediately on every page and the guard would silently degrade to a no-op
 * while the "resolved to 2 elements" strict-mode flake came back.
 *
 * This spec proves the streaming buffer is genuinely observed at least once
 * on a known-streaming route (/signature-journeys wraps its whole page in a
 * `<Suspense>`). The markers are recorded with a MutationObserver installed
 * BEFORE the document starts parsing (`page.addInitScript`): sampling the DOM
 * after `page.goto` resolves is racy on a fast local stream, because React's
 * throttled reveal can consume the markers between `domcontentloaded` and the
 * first protocol round-trip. The observer sees every parser-inserted node, so
 * if the shell ever contained a `B:` boundary template or an `S:` staging
 * buffer, the flag is set — deterministically. If React changes its marker
 * scheme, THIS test goes red instead of the guard rotting.
 *
 * NOTE: only a production build streams (playwright.config.ts CI_MODE runs
 * `node scripts/start-standalone.mjs`); this spec is in PR_SMOKE_SPECS, which
 * runs against that production path.
 */

declare global {
  interface Window {
    __streamingMarkerSeen?: boolean;
  }
}

test.describe('streaming reveal guard integrity', () => {
  test('the streaming buffer is observable on a Suspense route and gotoPage clears it', async ({
    page,
  }) => {
    await page.addInitScript((selector) => {
      window.__streamingMarkerSeen = false;
      const observer = new MutationObserver(() => {
        if (!window.__streamingMarkerSeen && document.querySelector(selector)) {
          window.__streamingMarkerSeen = true;
          observer.disconnect();
        }
      });
      observer.observe(document, { childList: true, subtree: true });
    }, STREAMING_MARKER_SELECTOR);

    // gotoPage itself must clear every marker before it returns…
    await gotoPage(page, '/signature-journeys');
    await expect(page.locator(STREAMING_MARKER_SELECTOR)).toHaveCount(0);

    // …and the observer proves the markers genuinely existed mid-stream.
    expect(
      await page.evaluate(() => window.__streamingMarkerSeen),
      `expected at least one React streaming marker (${STREAMING_MARKER_SELECTOR}) ` +
        'to appear while /signature-journeys streamed — if this fails, React changed ' +
        'its marker scheme and gotoPage has degraded to a no-op',
    ).toBe(true);
  });
});
