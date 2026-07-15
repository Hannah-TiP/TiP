import { expect, test } from '@playwright/test';

test.describe('welcome offer popup', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
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
