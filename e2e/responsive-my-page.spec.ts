import { test, expect, type Page } from '@playwright/test';
import { gotoPage } from './support/navigation';

/**
 * Mobile responsiveness for the authenticated my-page surface and the
 * onboarding flow (SMA-68).
 *
 * Runs under the authed project so /my-page, its sub-routes, and /onboarding
 * are reachable. Every route is checked at a 375px-wide viewport for the
 * absence of horizontal overflow (the document must not be wider than the
 * viewport).
 *
 * The PUBLIC auth pages (/sign-in, /register) live in
 * responsive-auth-pages.spec.ts, which runs unauthenticated — the middleware
 * redirects a logged-in user away from /sign-in to /my-page.
 */

const MOBILE_VIEWPORT = { width: 375, height: 812 };

// A few px of slack absorbs sub-pixel rounding from scrollbars / borders so
// the assertion only fails on a real fixed-width container overflow.
const OVERFLOW_SLACK = 2;

async function expectNoHorizontalScroll(page: Page) {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth + OVERFLOW_SLACK);
}

test.use({ viewport: MOBILE_VIEWPORT });

test.describe('Responsive my-page + onboarding (375px)', () => {
  test('onboarding flow does not overflow', async ({ page }) => {
    // An authed user lands on a resumed onboarding step (or is bounced to
    // /my-page if already complete) — either way the layout must fit 375px.
    await gotoPage(page, '/onboarding');
    await page.waitForLoadState('networkidle');
    await expectNoHorizontalScroll(page);
  });

  test('my-page dashboard does not overflow', async ({ page }) => {
    await gotoPage(page, '/my-page');
    // Either trips render or the empty state does; both must fit the viewport.
    await page.waitForLoadState('networkidle');
    await expectNoHorizontalScroll(page);
  });

  test('my-page sub-routes do not overflow', async ({ page }) => {
    const routes = [
      '/my-page/travel-history',
      '/my-page/membership',
      '/my-page/credits',
      '/my-page/referrals',
      '/my-page/wishlist',
      '/my-page/my-profile',
    ];

    for (const route of routes) {
      await gotoPage(page, route);
      await page.waitForLoadState('networkidle');
      await expectNoHorizontalScroll(page);
    }
  });

  test('trip detail page does not overflow (when a trip exists)', async ({ page }) => {
    await gotoPage(page, '/my-page');
    await page.waitForLoadState('networkidle');

    const tripLink = page.locator('a[href^="/my-page/trip/"]').first();
    const hasTrip = await tripLink.isVisible({ timeout: 5000 }).catch(() => false);
    test.skip(!hasTrip, 'No seeded upcoming trip for the E2E user');

    await tripLink.click();
    await page.waitForURL('**/my-page/trip/**', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await expectNoHorizontalScroll(page);
  });
});
