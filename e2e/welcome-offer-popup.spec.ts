import { expect, test } from '@playwright/test';

test.describe('welcome offer popup', () => {
  test.beforeEach(async ({ page }) => {
    // Reset the dismiss flag once per test, but NOT on in-test reloads.
    // addInitScript runs on every navigation (including page.reload()), so an
    // unconditional localStorage.clear() would wipe a dismiss the test just set
    // — making the "stays dismissed" reload assertion impossible. sessionStorage
    // survives a reload within the same tab yet is fresh per test context, so it
    // gates the clear to the very first navigation.
    await page.addInitScript(() => {
      if (!sessionStorage.getItem('welcome-offer-e2e-reset')) {
        localStorage.clear();
        sessionStorage.setItem('welcome-offer-e2e-reset', '1');
      }
    });
  });

  test('opens on the homepage and links to registration', async ({ page }) => {
    await page.goto('/');

    const popup = page.getByTestId('welcome-offer-popup');
    await expect(popup).toBeVisible();
    await expect(popup.getByRole('link')).toHaveAttribute('href', '/register');
  });

  test('stays dismissed for the active language', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('welcome-offer-popup').getByRole('button').click();
    await expect(page.getByTestId('welcome-offer-popup')).toBeHidden();

    await page.reload();
    await page.waitForTimeout(600);
    await expect(page.getByTestId('welcome-offer-popup')).toBeHidden();
  });
});
