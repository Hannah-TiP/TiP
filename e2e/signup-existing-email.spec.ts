import { test, expect } from '@playwright/test';

/**
 * E2E: signing up with an already-registered email.
 *
 * Regression for the UX bug where the backend issued a verification code to
 * an existing email and register() then failed with "Email already
 * registered" on the code-entry screen — making a correct code look "wrong".
 *
 * The backend now returns 409 at /api/auth/send-verification. The signup
 * screen must show a "sign in / reset password" panel (not the code step,
 * not a red error), carrying the email through to both destinations.
 *
 * Runs under the default `chromium` project (logged out). The
 * send-verification proxy is mocked so this stays deterministic and needs
 * no backend.
 */

const EMAIL = 'existing@example.com';
const ENCODED = encodeURIComponent(EMAIL); // existing%40example.com

test.describe('Signup with an already-registered email', () => {
  test.beforeEach(async ({ context }) => {
    await context.route('**/api/auth/send-verification*', async (route) => {
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({
          message:
            'An account with this email already exists. Please sign in or reset your password.',
        }),
      });
    });
  });

  async function submitSignup(page: import('@playwright/test').Page) {
    await page.goto('/register');
    await page.getByPlaceholder('Enter your email').fill(EMAIL);
    await page.getByPlaceholder('Create a password').fill('password123');
    await page.getByPlaceholder('Confirm password').fill('password123');
    await page.getByRole('button', { name: 'Send verification code' }).click();
  }

  test('shows the "account exists" panel instead of the code step', async ({ page }) => {
    await submitSignup(page);

    const panel = page.getByTestId('account-exists-panel');
    await expect(panel.getByText('This email is already registered.')).toBeVisible();
    // Must NOT advance to the verification-code step.
    await expect(page.getByPlaceholder('Enter 6-digit code')).toHaveCount(0);
    // Must NOT surface it as a generic red error.
    await expect(page.getByText('Failed to send verification code')).toHaveCount(0);

    // Scope to the panel — the page footer also has a global "Sign in" link.
    await expect(panel.getByRole('link', { name: 'Sign in' })).toHaveAttribute(
      'href',
      `/sign-in?email=${ENCODED}`,
    );
    await expect(panel.getByRole('link', { name: 'Reset password' })).toHaveAttribute(
      'href',
      `/forgot-password?email=${ENCODED}`,
    );
  });

  test('"Use a different email" returns to the signup form', async ({ page }) => {
    await submitSignup(page);
    await expect(page.getByText('This email is already registered.')).toBeVisible();

    await page.getByRole('button', { name: 'Use a different email' }).click();

    const emailInput = page.getByPlaceholder('Enter your email');
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveValue('');
  });

  test('Reset password carries the email into the forgot-password screen', async ({ page }) => {
    await submitSignup(page);
    await page
      .getByTestId('account-exists-panel')
      .getByRole('link', { name: 'Reset password' })
      .click();

    await expect(page).toHaveURL(`/forgot-password?email=${ENCODED}`);
    await expect(page.getByPlaceholder('Enter your email')).toHaveValue(EMAIL);
  });

  test('Sign in carries the email into the sign-in screen', async ({ page }) => {
    await submitSignup(page);
    await page.getByTestId('account-exists-panel').getByRole('link', { name: 'Sign in' }).click();

    await expect(page).toHaveURL(`/sign-in?email=${ENCODED}`);
    await expect(page.getByPlaceholder('Enter your email')).toHaveValue(EMAIL);
  });
});
