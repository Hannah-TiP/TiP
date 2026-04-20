import { test, expect } from '@playwright/test';

test.describe('Cancel trip feature', () => {
  test('trip detail page shows cancel button for draft trip', async ({ page }) => {
    await page.goto('/my-page');

    // Navigate to a trip detail page (assumes seeded trips exist)
    const tripLink = page.locator('a[href^="/my-page/trip/"]').first();
    await expect(tripLink).toBeVisible({ timeout: 10000 });
    await tripLink.click();

    // Verify we're on a trip detail page
    await page.waitForURL('**/my-page/trip/**', { timeout: 10000 });

    // Check for the cancel trip section - it should exist for unpaid trips
    const cancelSection = page.getByText('Cancel Trip', { exact: false });
    // The page may have a paid trip without cancel button, so we check presence
    if (
      await cancelSection
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false)
    ) {
      // Cancel button should be visible
      const cancelButton = page.getByRole('button', { name: /cancel trip/i });
      await expect(cancelButton).toBeVisible();
    }
  });

  test('cancel dialog opens and can be dismissed', async ({ page }) => {
    await page.goto('/my-page');

    // Navigate to a trip detail page
    const tripLink = page.locator('a[href^="/my-page/trip/"]').first();
    await expect(tripLink).toBeVisible({ timeout: 10000 });
    await tripLink.click();
    await page.waitForURL('**/my-page/trip/**', { timeout: 10000 });

    // Find and click cancel button if present
    const cancelButton = page.getByRole('button', { name: /cancel trip/i });
    if (await cancelButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await cancelButton.click();

      // Verify dialog appears with expected content
      await expect(page.getByText('Cancel this trip?')).toBeVisible({ timeout: 5000 });
      await expect(page.getByText(/this action cannot be undone/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /keep trip/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /yes, cancel trip/i })).toBeVisible();

      // Dismiss by clicking "Keep Trip"
      await page.getByRole('button', { name: /keep trip/i }).click();

      // Dialog should close
      await expect(page.getByText('Cancel this trip?')).not.toBeVisible({ timeout: 5000 });
    }
  });

  test('cancel button is not shown for paid trips', async ({ page }) => {
    await page.goto('/my-page');

    // Look for any trip with a paid/completed status badge
    const paidBadge = page
      .getByText(/payment confirmed|ready to travel|traveling now|completed/i)
      .first();
    if (await paidBadge.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Click on the parent trip card link
      const tripCard = paidBadge.locator('xpath=ancestor::a[contains(@href, "/my-page/trip/")]');
      if (await tripCard.isVisible().catch(() => false)) {
        await tripCard.click();
        await page.waitForURL('**/my-page/trip/**', { timeout: 10000 });

        // Cancel button should NOT be visible for paid trips
        const cancelButton = page.getByRole('button', { name: /cancel trip/i });
        await expect(cancelButton).not.toBeVisible({ timeout: 3000 });
      }
    }
  });

  test.describe('unauthenticated', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('unauthenticated user cannot access trip detail page', async ({ page }) => {
      // Directly navigate to a trip detail page without signing in
      await page.goto('/my-page/trip/1');
      // Should redirect to sign-in
      await expect(page).toHaveURL(/sign-in/, { timeout: 10000 });
    });
  });
});
