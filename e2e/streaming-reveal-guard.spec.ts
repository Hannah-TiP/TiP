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
 * This spec proves the streaming buffer is genuinely observed at least once:
 * it navigates a known-streaming route (/signature-journeys wraps its whole
 * page in a `<Suspense>`) with `waitUntil: 'domcontentloaded'` — which
 * resolves before React's throttled reveal (~first paint + 300 ms) consumes
 * the boundary — asserts a marker IS present, then asserts `gotoPage` clears
 * it. If React changes its marker scheme, THIS test goes red instead of the
 * guard rotting.
 *
 * NOTE: only a production build streams (playwright.config.ts CI_MODE runs
 * `node scripts/start-standalone.mjs`); this spec is in PR_SMOKE_SPECS, which
 * runs against that production path.
 */

test.describe('streaming reveal guard integrity', () => {
  test('the streaming buffer is observable on a Suspense route and gotoPage clears it', async ({
    page,
  }) => {
    // Bare page.goto is deliberate here: gotoPage would consume the very
    // window this test needs to observe.
    // eslint-disable-next-line e2e/no-bare-page-goto
    await page.goto('/signature-journeys', { waitUntil: 'domcontentloaded' });

    // At domcontentloaded the boundary is not yet revealed: at minimum the
    // `B:` boundary template (shipped with the shell) must still be present;
    // on a fully-arrived stream the hidden `S:` staging buffer is too.
    const markerCount = await page.locator(STREAMING_MARKER_SELECTOR).count();
    expect(
      markerCount,
      `expected at least one React streaming marker (${STREAMING_MARKER_SELECTOR}) ` +
        'right after domcontentloaded on a Suspense-wrapped route — if this fails, ' +
        'React changed its marker scheme and gotoPage has degraded to a no-op',
    ).toBeGreaterThan(0);

    // The same navigation through gotoPage must clear every marker.
    await gotoPage(page, '/signature-journeys');
    await expect(page.locator(STREAMING_MARKER_SELECTOR)).toHaveCount(0);
  });
});
