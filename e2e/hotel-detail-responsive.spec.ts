import { test, expect } from '@playwright/test';

// Hotel slug known to be seeded with hero images, rooms, and photo-bearing
// amenities (same fixture used by hotel-detail-amenity-photos.spec.ts).
const HOTEL_SLUG = 'aman-tokyo';

test.describe('Hotel detail — responsive at 375px', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test.beforeEach(async ({ page }) => {
    await page.goto(`/hotel/${HOTEL_SLUG}`);
    await page.waitForSelector('[aria-labelledby="amenities-title"]', { timeout: 15000 });
  });

  test('no horizontal scroll and content renders at 375px', async ({ page }) => {
    // Let images/layout settle.
    await page.waitForLoadState('networkidle');

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);

    // Hero title is visible.
    await expect(page.locator('h1').first()).toBeVisible();

    // Sticky booking bar CTA is visible and meets the 44px tap-target minimum.
    const stickyCta = page.locator('[aria-label="Booking summary"] button');
    await expect(stickyCta).toBeVisible();
    const box = await stickyCta.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);

    await page.screenshot({
      path: 'e2e/screenshots/hotel-detail-375.png',
      fullPage: true,
    });
  });

  test('amenity lightbox close button is thumb-friendly and closes on backdrop tap', async ({
    page,
  }) => {
    const photoButton = page.locator('[data-testid^="amenity-photo-button-"]').first();
    await photoButton.click();

    const modal = page.locator('[data-testid="modal-dialog"]');
    await expect(modal).toBeVisible();

    const closeButton = page.locator('[data-testid="modal-close"]');
    await expect(closeButton).toBeVisible();
    const closeBox = await closeButton.boundingBox();
    expect(closeBox).not.toBeNull();
    expect(closeBox!.width).toBeGreaterThanOrEqual(44);
    expect(closeBox!.height).toBeGreaterThanOrEqual(44);

    await page.locator('[data-testid="modal-backdrop"]').click({ position: { x: 10, y: 10 } });
    await expect(modal).not.toBeVisible();
  });
});
