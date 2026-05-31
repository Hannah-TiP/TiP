import { test, expect } from '@playwright/test';

test.describe('Hotel detail — hero gallery (render-time crop)', () => {
  test('hero renders the hotel name and at least one hero image', async ({ page }) => {
    await page.goto('/hotel/aman-tokyo');

    const hero = page.locator('section').first();
    await expect(hero).toBeVisible({ timeout: 15000 });

    // The hotel name renders as the hero h1.
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // At least the primary hero image is present.
    const heroImages = hero.locator('img');
    expect(await heroImages.count()).toBeGreaterThanOrEqual(1);

    // Capture the hero for visual verification of cropped vs full-frame rendering.
    await hero.screenshot({ path: 'e2e/screenshots/hotel-hero-gallery.png' });
  });
});
