import { test, expect } from '@playwright/test';
import { gotoPage } from './support/navigation';

test.describe('Auth redirects (logged out)', () => {
  test('/my-page redirects to sign-in', async ({ page }) => {
    await gotoPage(page, '/my-page');
    await expect(page).toHaveURL(/sign-in.*redirect/);
  });

  test('/concierge redirects to sign-in', async ({ page }) => {
    await gotoPage(page, '/concierge');
    await expect(page).toHaveURL(/sign-in.*redirect/);
  });

  test('/onboarding redirects to sign-in', async ({ page }) => {
    await gotoPage(page, '/onboarding');
    await expect(page).toHaveURL(/sign-in.*redirect/);
  });

  test('redirect param preserves original path', async ({ page }) => {
    await gotoPage(page, '/my-page/my-profile');
    const url = new URL(page.url());
    expect(url.searchParams.get('redirect')).toBe('/my-page/my-profile');
  });
});
