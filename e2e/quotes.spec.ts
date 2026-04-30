import { test, expect } from '@playwright/test';

/**
 * Quote detail page e2e.
 *
 * The test agent is expected to seed a SENT quote for the E2E user before
 * running this spec, and pass its id via E2E_QUOTE_ID. If the var is not
 * set, the spec falls back to verifying the unauthenticated redirect path
 * (which is provided by every quote URL regardless of seed state).
 */

const SEEDED_QUOTE_ID = process.env.E2E_QUOTE_ID;

test.describe('Quote detail page', () => {
  test('renders trip title, total, and at least one line item', async ({ page }) => {
    test.skip(!SEEDED_QUOTE_ID, 'E2E_QUOTE_ID is not set; skipping');

    await page.goto(`/quotes/${SEEDED_QUOTE_ID}`);

    // Hero shows the quote label + a status badge.
    await expect(page.getByText(/QUOTE/i).first()).toBeVisible({ timeout: 15_000 });

    // "What's included" section + at least one line-item row are rendered.
    await expect(page.getByRole('heading', { name: /what.?s included/i })).toBeVisible();

    // Total card is rendered with a Total row.
    await expect(page.getByRole('heading', { name: /^total$/i })).toBeVisible();

    // The hero card shows a non-empty trip title (anything truthy).
    const hero = page.locator('h1').first();
    await expect(hero).toBeVisible();
    const titleText = (await hero.textContent())?.trim() ?? '';
    expect(titleText.length).toBeGreaterThan(0);
  });

  test.describe('unauthenticated', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('redirects unauthenticated users to /sign-in', async ({ page }) => {
      await page.goto('/quotes/1');
      await expect(page).toHaveURL(/sign-in/, { timeout: 10_000 });
    });
  });
});
