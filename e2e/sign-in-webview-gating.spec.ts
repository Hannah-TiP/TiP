import { test, expect } from '@playwright/test';

// Runs in the DEFAULT (unauthenticated) chromium project — middleware
// bounces authed sessions off /sign-in, and these pages are public.

// Real-world KakaoTalk Android in-app browser user agent.
const KAKAOTALK_UA =
  'Mozilla/5.0 (Linux; Android 13; SM-G991N Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/115.0.0.0 Mobile Safari/537.36;KAKAOTALK/10.3.0';

test.describe('webview login gating — KakaoTalk UA', () => {
  test.use({ userAgent: KAKAOTALK_UA });

  test('/sign-in hides Google login and shows the notice + escape hatch', async ({ page }) => {
    await page.goto('/sign-in');

    const notice = page.getByTestId('webview-login-notice');
    await expect(notice).toBeVisible();

    // Google widget must not render at all in a detected webview.
    await expect(page.getByTestId('google-signin-button')).toHaveCount(0);
    await expect(page.locator('iframe[src*="accounts.google.com"]')).toHaveCount(0);

    // KakaoTalk escape hatch points at the openExternal scheme.
    const escapeHatch = page.getByTestId('webview-open-external');
    await expect(escapeHatch).toBeVisible();
    const href = await escapeHatch.getAttribute('href');
    expect(href).toContain('kakaotalk://web/openExternal?url=');

    // Copy-link fallback is always offered.
    await expect(page.getByTestId('webview-copy-link')).toBeVisible();

    // Email/password login stays fully usable.
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue', exact: true })).toBeEnabled();
  });

  test('/register hides Google login and shows the notice', async ({ page }) => {
    await page.goto('/register');

    await expect(page.getByTestId('webview-login-notice')).toBeVisible();
    await expect(page.getByTestId('google-signin-button')).toHaveCount(0);
    await expect(page.getByTestId('webview-open-external')).toBeVisible();

    // Email signup form stays fully usable.
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /send verification code/i })).toBeEnabled();
  });
});

test.describe('webview login gating — normal browser UA', () => {
  test('/sign-in still renders the Google sign-in button, no notice', async ({ page }) => {
    await page.goto('/sign-in');

    // The auth-code sign-in button (SMA-119) renders synchronously in a
    // normal browser — no remote GSI script injection to wait on.
    await expect(page.getByTestId('google-signin-button')).toBeVisible();
    await expect(page.getByTestId('webview-login-notice')).toHaveCount(0);
  });

  test('/register still renders the Google sign-in button, no notice', async ({ page }) => {
    await page.goto('/register');

    await expect(page.getByTestId('google-signin-button')).toBeVisible();
    await expect(page.getByTestId('webview-login-notice')).toHaveCount(0);
  });
});
