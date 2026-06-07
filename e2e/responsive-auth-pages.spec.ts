import { test, expect, type Page } from '@playwright/test';

/**
 * Mobile responsiveness for the PUBLIC (unauthenticated) auth pages (SMA-68).
 *
 * Runs under the default unauthenticated `chromium` project (this file is NOT
 * in AUTH_REQUIRED_SPECS). That matters because the middleware redirects a
 * logged-in user away from /sign-in to /my-page, so the sign-in form only
 * renders for an anonymous visitor. /register has no such redirect.
 *
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

test.describe('Responsive public auth pages (375px)', () => {
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
});
