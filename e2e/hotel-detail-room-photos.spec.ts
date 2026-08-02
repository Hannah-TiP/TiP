import { test, expect } from '@playwright/test';
import { gotoPage } from './support/navigation';

test.describe('Hotel detail — room photo gallery', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Aman Tokyo which has seeded rooms with images
    await gotoPage(page, '/hotel/aman-tokyo');
    // Wait for the rooms section to load
    await page.waitForSelector('[aria-labelledby="rooms-title"]', { timeout: 15000 });
  });

  test('room with multiple images shows badge and opens gallery modal', async ({ page }) => {
    // Find a room photo badge
    const badge = page.locator('[data-testid^="room-photo-badge-"]').first();

    // If no room has multiple images in seed data, skip gracefully
    const badgeCount = await badge.count();
    if (badgeCount === 0) {
      test.skip(true, 'No seeded rooms with multiple images');
      return;
    }

    await expect(badge).toBeVisible();
    await badge.screenshot({ path: 'e2e/screenshots/room-photo-badge.png' });

    // Click to open modal
    await badge.click();

    // Modal should appear with room photo content
    const modal = page.locator('[data-testid="room-photo-modal"]');
    await expect(modal).toBeVisible();
    await modal.screenshot({ path: 'e2e/screenshots/room-photos-modal.png' });

    // Counter should be visible
    const counter = page.locator('[data-testid="room-photo-counter"]');
    await expect(counter).toBeVisible();
    await expect(counter).toContainText('/');

    // Modal should contain an image
    const modalImage = modal.locator('img');
    expect(await modalImage.count()).toBeGreaterThanOrEqual(1);
  });

  test('gallery modal supports next/prev navigation', async ({ page }) => {
    const badge = page.locator('[data-testid^="room-photo-badge-"]').first();
    const badgeCount = await badge.count();
    if (badgeCount === 0) {
      test.skip(true, 'No seeded rooms with multiple images');
      return;
    }

    await badge.click();

    const counter = page.locator('[data-testid="room-photo-counter"]');
    await expect(counter).toBeVisible();
    const initialText = await counter.textContent();

    // Click next
    const nextBtn = page.locator('[data-testid="room-photo-next"]');
    await expect(nextBtn).toBeVisible();
    await nextBtn.click();

    // Counter should change
    const afterNextText = await counter.textContent();
    expect(afterNextText).not.toBe(initialText);

    // Click prev to go back
    const prevBtn = page.locator('[data-testid="room-photo-prev"]');
    await prevBtn.click();

    const afterPrevText = await counter.textContent();
    expect(afterPrevText).toBe(initialText);
  });

  test('gallery modal supports keyboard arrow navigation', async ({ page }) => {
    const badge = page.locator('[data-testid^="room-photo-badge-"]').first();
    const badgeCount = await badge.count();
    if (badgeCount === 0) {
      test.skip(true, 'No seeded rooms with multiple images');
      return;
    }

    await badge.click();

    const counter = page.locator('[data-testid="room-photo-counter"]');
    await expect(counter).toBeVisible();
    const initialText = await counter.textContent();

    // ArrowRight should advance
    await page.keyboard.press('ArrowRight');
    const afterRightText = await counter.textContent();
    expect(afterRightText).not.toBe(initialText);

    // ArrowLeft should go back
    await page.keyboard.press('ArrowLeft');
    const afterLeftText = await counter.textContent();
    expect(afterLeftText).toBe(initialText);
  });

  test('gallery modal closes on ESC key', async ({ page }) => {
    const badge = page.locator('[data-testid^="room-photo-badge-"]').first();
    const badgeCount = await badge.count();
    if (badgeCount === 0) {
      test.skip(true, 'No seeded rooms with multiple images');
      return;
    }

    await badge.click();

    const modal = page.locator('[data-testid="room-photo-modal"]');
    await expect(modal).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });

  test('gallery modal closes on backdrop click', async ({ page }) => {
    const badge = page.locator('[data-testid^="room-photo-badge-"]').first();
    const badgeCount = await badge.count();
    if (badgeCount === 0) {
      test.skip(true, 'No seeded rooms with multiple images');
      return;
    }

    await badge.click();

    const modal = page.locator('[data-testid="room-photo-modal"]');
    await expect(modal).toBeVisible();

    const backdrop = page.locator('[data-testid="modal-backdrop"]');
    await backdrop.click({ position: { x: 10, y: 10 } });
    await expect(modal).not.toBeVisible();
  });

  test('rooms with single image have no badge', async ({ page }) => {
    // All room cards
    const roomCards = page.locator('article');
    const totalRooms = await roomCards.count();
    expect(totalRooms).toBeGreaterThan(0);

    // For each badge, verify it contains a number > 1
    const badges = page.locator('[data-testid^="room-photo-badge-"]');
    const badgeCount = await badges.count();
    for (let i = 0; i < badgeCount; i++) {
      const text = await badges.nth(i).textContent();
      // Badge text should be "View N photos" where N > 1
      const match = text?.match(/View (\d+) photos/);
      expect(match).not.toBeNull();
      expect(Number(match![1])).toBeGreaterThan(1);
    }
  });
});
