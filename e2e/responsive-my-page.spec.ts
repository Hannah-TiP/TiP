import { test, expect, type Page } from '@playwright/test';

/**
 * Mobile responsiveness for the authenticated my-page surface, the auth
 * pages, and the onboarding flow (SMA-68).
 *
 * Runs under the authed project so /my-page and its sub-routes are reachable.
 * Every route is checked at a 375px-wide viewport for the absence of
 * horizontal overflow (the document must not be wider than the viewport).
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

test.describe('Responsive my-page + auth pages (375px)', () => {
  test('sign-in form is full-width and does not overflow', async ({ page }) => {
    await page.goto('/sign-in');
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();

    // The form container must not exceed the viewport width.
    const form = page.locator('form').first();
    const box = await form.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeLessThanOrEqual(MOBILE_VIEWPORT.width);

    await expectNoHorizontalScroll(page);
  });

  test('register form does not overflow', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expectNoHorizontalScroll(page);
  });

  test('onboarding flow does not overflow', async ({ page }) => {
    // An authed user lands on a resumed onboarding step (or is bounced to
    // /my-page if already complete) — either way the layout must fit 375px.
    await page.goto('/onboarding');
    await page.waitForLoadState('networkidle');
    await expectNoHorizontalScroll(page);
  });

  test('my-page dashboard does not overflow', async ({ page }) => {
    await page.goto('/my-page');
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
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await expectNoHorizontalScroll(page);
    }
  });

  test('trip detail page does not overflow (when a trip exists)', async ({ page }) => {
    await page.goto('/my-page');
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
