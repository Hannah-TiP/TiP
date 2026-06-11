import { test, expect } from '@playwright/test';

// /my-page/my-profile is auth-gated; this spec runs in the chromium-authed
// project. We stub the profile fetch so the page renders deterministically,
// and stub the change-password proxy so the flow doesn't mutate real data.

async function stubProfile(page: import('@playwright/test').Page) {
  await page.route('**/api/profile', async (route) => {
    if (route.request().method() !== 'GET') return route.fallback();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 200,
        message: 'Success',
        data: {
          id: 1,
          email: 'tester@example.com',
          first_name: 'Test',
          last_name: 'User',
          travel_styles: [],
        },
      }),
    });
  });
}

async function openModal(page: import('@playwright/test').Page) {
  await page.goto('/my-page/my-profile');
  await page.getByTestId('open-change-password').click();
  await expect(page.getByTestId('change-password-form')).toBeVisible({ timeout: 10_000 });
}

test.describe('Change password modal on /my-page/my-profile', () => {
  test('opens the modal from the Security section', async ({ page }) => {
    await stubProfile(page);
    await openModal(page);
    await expect(page.getByTestId('current-password-input')).toBeVisible();
    await expect(page.getByTestId('new-password-input')).toBeVisible();
    await expect(page.getByTestId('confirm-password-input')).toBeVisible();
  });

  test('shows a too-short error for new passwords under 8 chars (no request)', async ({ page }) => {
    await stubProfile(page);
    let called = false;
    await page.route('**/api/me/change-password', async (route) => {
      called = true;
      await route.fulfill({ status: 204, body: '' });
    });

    await openModal(page);
    await page.getByTestId('current-password-input').fill('old-password');
    await page.getByTestId('new-password-input').fill('short');
    await page.getByTestId('confirm-password-input').fill('short');
    await page.getByTestId('change-password-submit').click();

    await expect(page.getByTestId('change-password-error')).toBeVisible();
    expect(called).toBe(false);
  });

  test('shows a mismatch error when confirm differs (no request)', async ({ page }) => {
    await stubProfile(page);
    let called = false;
    await page.route('**/api/me/change-password', async (route) => {
      called = true;
      await route.fulfill({ status: 204, body: '' });
    });

    await openModal(page);
    await page.getByTestId('current-password-input').fill('old-password');
    await page.getByTestId('new-password-input').fill('brand-new-password');
    await page.getByTestId('confirm-password-input').fill('different-password');
    await page.getByTestId('change-password-submit').click();

    await expect(page.getByTestId('change-password-error')).toBeVisible();
    expect(called).toBe(false);
  });

  test('surfaces the backend error for a wrong current password', async ({ page }) => {
    await stubProfile(page);
    await page.route('**/api/me/change-password', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          message: 'Your current password is incorrect.',
        }),
      });
    });

    await openModal(page);
    await page.getByTestId('current-password-input').fill('wrong-password');
    await page.getByTestId('new-password-input').fill('brand-new-password');
    await page.getByTestId('confirm-password-input').fill('brand-new-password');
    await page.getByTestId('change-password-submit').click();

    const error = page.getByTestId('change-password-error');
    await expect(error).toBeVisible();
    await expect(error).toContainText(/incorrect/i);
    await expect(page.getByTestId('change-password-form')).toBeVisible();
  });

  test('valid input closes the modal and shows success feedback', async ({ page }) => {
    await stubProfile(page);
    await page.route('**/api/me/change-password', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    await openModal(page);
    await page.getByTestId('current-password-input').fill('old-password');
    await page.getByTestId('new-password-input').fill('brand-new-password');
    await page.getByTestId('confirm-password-input').fill('brand-new-password');
    await page.getByTestId('change-password-submit').click();

    await expect(page.getByTestId('change-password-form')).toBeHidden({ timeout: 10_000 });
    await expect(page.getByText(/changed successfully/i)).toBeVisible();
  });
});
