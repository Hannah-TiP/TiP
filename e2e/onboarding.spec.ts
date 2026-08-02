import { test, expect } from '@playwright/test';
import { gotoPage } from './support/navigation';

test.describe('Onboarding page (logged out)', () => {
  test('redirects unauthenticated users to sign-in with redirect param', async ({ page }) => {
    await gotoPage(page, '/onboarding');
    await expect(page).toHaveURL(/sign-in/);
    const url = new URL(page.url());
    expect(url.searchParams.get('redirect')).toBe('/onboarding');
  });
});
