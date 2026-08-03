import { test, expect } from '@playwright/test';
import { gotoPage } from './support/navigation';

test.describe('Hotel detail — amenity & facility photos lightbox', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Aman Tokyo which has seeded features with images
    await gotoPage(page, '/hotel/aman-tokyo');
    // Wait for the amenities section to load
    await page.waitForSelector('[aria-labelledby="amenities-title"]', { timeout: 15000 });
  });

  test('photo-bearing feature tile is clickable and opens modal', async ({ page }) => {
    // Screenshot the grid before interaction
    const amenitiesSection = page.locator('[aria-labelledby="amenities-title"]');
    await expect(amenitiesSection).toBeVisible();
    await amenitiesSection.screenshot({ path: 'e2e/screenshots/amenity-grid-closed.png' });

    // Find a photo-bearing feature button
    const photoButton = page.locator('[data-testid^="amenity-photo-button-"]').first();
    await expect(photoButton).toBeVisible();

    // Click to open modal
    await photoButton.click();

    // Modal should appear
    const modal = page.locator('[data-testid="modal-dialog"]');
    await expect(modal).toBeVisible();
    await modal.screenshot({ path: 'e2e/screenshots/amenity-photos-modal.png' });

    // Modal should contain images
    const modalImages = modal.locator('img');
    expect(await modalImages.count()).toBeGreaterThanOrEqual(1);
  });

  test('modal closes on backdrop click', async ({ page }) => {
    const photoButton = page.locator('[data-testid^="amenity-photo-button-"]').first();
    await photoButton.click();

    const modal = page.locator('[data-testid="modal-dialog"]');
    await expect(modal).toBeVisible();

    // Click the backdrop
    const backdrop = page.locator('[data-testid="modal-backdrop"]');
    await backdrop.click({ position: { x: 10, y: 10 } });

    // Modal should be closed
    await expect(modal).not.toBeVisible();
  });

  test('modal closes on ESC key', async ({ page }) => {
    const photoButton = page.locator('[data-testid^="amenity-photo-button-"]').first();
    await photoButton.click();

    const modal = page.locator('[data-testid="modal-dialog"]');
    await expect(modal).toBeVisible();

    // Press ESC
    await page.keyboard.press('Escape');

    // Modal should be closed
    await expect(modal).not.toBeVisible();
  });

  test('non-photo feature tiles remain non-interactive', async ({ page }) => {
    const listItems = page.locator('[aria-labelledby="amenities-title"] ul > li');
    const totalCount = await listItems.count();
    expect(totalCount).toBeGreaterThan(0);

    const buttons = page.locator('[data-testid^="amenity-photo-button-"]');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThanOrEqual(1);

    // Any tile that does NOT contain a photo button must be truly non-interactive:
    // no nested button, no role=button. Vacuously satisfied if every tile has photos.
    const nonPhotoTiles = page.locator(
      '[aria-labelledby="amenities-title"] ul > li:not(:has(button[data-testid^="amenity-photo-button-"]))',
    );
    const nonPhotoCount = await nonPhotoTiles.count();
    for (let i = 0; i < nonPhotoCount; i++) {
      const tile = nonPhotoTiles.nth(i);
      await expect(tile.locator('button')).toHaveCount(0);
      await expect(tile).not.toHaveAttribute('role', 'button');
    }
  });
});
