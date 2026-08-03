import { test, expect } from '@playwright/test';
import { gotoPage } from './support/navigation';

/**
 * Trip sharing e2e (SMA-15).
 *
 * The share modal + shared-trips list require an authenticated session
 * (this spec runs in the chromium-authed project). A seeded trip id can be
 * provided via E2E_TRIP_ID to exercise the share modal against a real trip;
 * otherwise those assertions are skipped. The /shared-trips/[id] auth gate is
 * verified unauthenticated and needs no seed.
 */

const SEEDED_TRIP_ID = process.env.E2E_TRIP_ID;

test.describe('Shared trips list', () => {
  test('renders the shared-with-me page with header + SubNav tab', async ({ page }) => {
    await gotoPage(page, '/my-page/shared-trips');

    // The page heading renders.
    await expect(page.getByRole('heading', { name: /shared with me/i })).toBeVisible({
      timeout: 15_000,
    });

    // The SubNav "Shared With Me" tab is present and active (bold).
    const tab = page.getByRole('link', { name: 'Shared With Me' });
    await expect(tab.first()).toBeVisible();
  });

  test('my-page dashboard exposes a "Shared with me" entry point', async ({ page }) => {
    await gotoPage(page, '/my-page');
    const link = page.getByTestId('shared-with-me-link');
    await expect(link).toBeVisible({ timeout: 15_000 });
    await link.click();
    await expect(page).toHaveURL(/\/my-page\/shared-trips/);
  });
});

test.describe('Share modal', () => {
  test('opens the share modal from a trip detail page', async ({ page }) => {
    test.skip(!SEEDED_TRIP_ID, 'E2E_TRIP_ID is not set; skipping');

    await gotoPage(page, `/my-page/trip/${SEEDED_TRIP_ID}`);
    const shareButton = page.getByTestId('share-trip-button');
    await expect(shareButton).toBeVisible({ timeout: 15_000 });
    await shareButton.click();

    // Modal opens with the email input + submit control.
    await expect(page.getByTestId('share-emails-input')).toBeVisible();
    await expect(page.getByTestId('share-submit')).toBeVisible();

    // Submitting with no emails shows a validation error.
    await page.getByTestId('share-submit').click();
    await expect(page.getByTestId('share-error')).toBeVisible();
  });
});

test.describe('Shared trip detail — unauthenticated', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('redirects unauthenticated users to /sign-in with a callbackUrl', async ({ page }) => {
    await gotoPage(page, '/shared-trips/1');
    await expect(page).toHaveURL(/sign-in/, { timeout: 10_000 });
    // The callbackUrl carries the shared-trip path so auth returns the user here.
    await expect(page).toHaveURL(/callbackUrl=%2Fshared-trips%2F1/);
  });
});
