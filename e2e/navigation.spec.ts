import { test, expect } from '@playwright/test';

test.describe('Page navigation', () => {
  test('dream-hotels page loads', async ({ page }) => {
    await page.goto('/dream-hotels');
    await expect(page).toHaveURL(/dream-hotels/);
  });

  test('sign-in page loads', async ({ page }) => {
    await page.goto('/sign-in');
    await expect(page).toHaveURL(/sign-in/);
  });

  test('register page loads', async ({ page }) => {
    await page.goto('/register');
    await expect(page).toHaveURL(/register/);
  });

  test('insights page loads', async ({ page }) => {
    await page.goto('/insights');
    await expect(page).toHaveURL(/insights/);
  });
});
