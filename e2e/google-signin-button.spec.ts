import { test, expect } from '@playwright/test';
import { gotoPage } from './support/navigation';

/**
 * E2E: the custom Google auth-code button (SMA-119).
 *
 * The GIS-rendered <GoogleLogin> credential button was replaced with a
 * custom branded button driving useGoogleLogin({ flow: 'auth-code' }) so
 * iOS Safari (ITP) no longer hangs after account selection. These tests
 * assert the custom button renders on both auth pages; the live OAuth
 * round-trip itself cannot be automated and is verified manually.
 *
 * Runs under the default `chromium` project (logged out) — middleware
 * bounces authenticated users off /sign-in and /register.
 */

test.describe('Custom Google sign-in button', () => {
  test('renders on /sign-in with the branded label and logo', async ({ page }) => {
    await gotoPage(page, '/sign-in');

    const button = page.getByTestId('google-signin-button');
    await expect(button).toBeVisible();
    await expect(button).toHaveText(/continue with google/i);
    await expect(button.locator('svg')).toBeVisible();
  });

  test('renders on /register with the branded label and logo', async ({ page }) => {
    await gotoPage(page, '/register');

    const button = page.getByTestId('google-signin-button');
    await expect(button).toBeVisible();
    await expect(button).toHaveText(/continue with google/i);
    await expect(button.locator('svg')).toBeVisible();
  });

  test('no GIS iframe button is rendered on /sign-in', async ({ page }) => {
    await gotoPage(page, '/sign-in');

    await expect(page.getByTestId('google-signin-button')).toBeVisible();
    // The old <GoogleLogin> rendered inside an accounts.google.com iframe.
    await expect(page.locator('iframe[src*="accounts.google.com"]')).toHaveCount(0);
  });
});
