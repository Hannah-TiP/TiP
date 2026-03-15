import { test, expect } from '@playwright/test';

test.describe('Onboarding page (logged out)', () => {
  test('redirects unauthenticated users to sign-in with redirect param', async ({ page }) => {
    await page.goto('/onboarding');
    await expect(page).toHaveURL(/sign-in/);
    const url = new URL(page.url());
    expect(url.searchParams.get('redirect')).toBe('/onboarding');
  });
});
