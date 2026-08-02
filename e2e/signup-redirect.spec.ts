import { test, expect } from '@playwright/test';
import { gotoPage } from './support/navigation';

/**
 * E2E (SMA-92): the "Plan My Trip" context (`redirect` param) must survive the
 * SIGN-UP chain — sign-in → register → onboarding — exactly like it does on the
 * login path. The whole context rides in a single `redirect` URL param; this
 * spec verifies it is threaded at every hop and dropped when external.
 *
 * Runs under the default `chromium` project (logged out) so the auth pages are
 * reachable (middleware bounces authed users off /sign-in & /register).
 */

const REDIRECT = '/concierge?prefill=1&cityId=7&city=Paris';
const ENCODED = encodeURIComponent(REDIRECT);

test.describe('Plan My Trip redirect survives the sign-up chain', () => {
  test('sign-in "Sign up" link forwards the redirect (and ref) to /register', async ({ page }) => {
    await gotoPage(page, `/sign-in?redirect=${ENCODED}&ref=ABCD1234`);

    const signUp = page.getByRole('link', { name: /sign up/i });
    const href = await signUp.getAttribute('href');
    expect(href).toBeTruthy();

    const url = new URL(href!, 'http://localhost');
    expect(url.pathname).toBe('/register');
    expect(url.searchParams.get('redirect')).toBe(REDIRECT);
    expect(url.searchParams.get('ref')).toBe('ABCD1234');
  });

  test('sign-in "Sign up" link drops an external redirect (open-redirect guard)', async ({
    page,
  }) => {
    await gotoPage(page, `/sign-in?redirect=${encodeURIComponent('https://evil.com')}`);

    const href = await page.getByRole('link', { name: /sign up/i }).getAttribute('href');
    const url = new URL(href!, 'http://localhost');
    expect(url.pathname).toBe('/register');
    expect(url.searchParams.get('redirect')).toBeNull();
  });

  test('sign-in "Sign up" link with no redirect points at bare /register', async ({ page }) => {
    await gotoPage(page, '/sign-in');
    const href = await page.getByRole('link', { name: /sign up/i }).getAttribute('href');
    expect(href).toBe('/register');
  });

  test('register preserves the redirect through the email→verify step transition', async ({
    page,
    context,
  }) => {
    // The verification step is in-page React state, so the URL (and its
    // redirect param) must remain intact when advancing to the code screen.
    await context.route('**/api/auth/send-verification', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { sent: true } }),
      });
    });

    await gotoPage(page, `/register?redirect=${ENCODED}`);
    await page.getByPlaceholder('Enter your email').fill('new-user@example.com');
    await page.getByPlaceholder('Create a password').fill('password123');
    await page.getByPlaceholder('Confirm password').fill('password123');
    await page.getByRole('button', { name: 'Send verification code' }).click();

    // Advanced to the code-entry step…
    await expect(page.getByPlaceholder('Enter 6-digit code')).toBeVisible();
    // …and the redirect param is still on the URL, ready to thread into onboarding.
    const url = new URL(page.url());
    expect(url.searchParams.get('redirect')).toBe(REDIRECT);
  });
});
