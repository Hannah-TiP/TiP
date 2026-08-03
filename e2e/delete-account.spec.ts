import { test, expect, type Page } from '@playwright/test';
import { gotoPage } from './support/navigation';

// /my-page/my-profile is auth-gated; this spec runs in the chromium-authed
// project (see change-password.spec.ts — the same pattern). We stub the
// profile fetch so the page renders deterministically, and stub the
// delete-account proxy so nothing real is ever deactivated.

const SUCCESS_BODY = JSON.stringify({
  code: 200,
  message: 'Success',
  data: {
    deletion_requested_at: '2026-07-30T09:00:00Z',
    purge_after: '2026-08-29T09:00:00Z',
  },
});

async function stubProfile(page: Page, hasPassword: boolean) {
  await page.route('**/api/profile*', async (route) => {
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
          has_password: hasPassword,
        },
      }),
    });
  });
}

async function openModal(page: Page) {
  await gotoPage(page, '/my-page/my-profile');
  await page.getByTestId('open-delete-account').click();
  await expect(page.getByTestId('delete-account-form')).toBeVisible({ timeout: 10_000 });
}

test.describe('Delete account flow on /my-page/my-profile', () => {
  test('opens from the Danger Zone card and discloses deleted vs retained data', async ({
    page,
  }) => {
    await stubProfile(page, true);
    await openModal(page);

    const form = page.getByTestId('delete-account-form');
    // Deleted vs retained disclosure (account.delete.disclosure_* copy).
    await expect(form).toContainText(/permanently deleted/i);
    await expect(form).toContainText(/5 years/i);
    await expect(form).toContainText(/3 years/i);
    await expect(form).toContainText(/30 days/i);
    // Password account → password re-auth, no OTP controls.
    await expect(page.getByTestId('delete-password-input')).toBeVisible();
    await expect(page.getByTestId('delete-code-input')).toHaveCount(0);
    await expect(page.getByTestId('send-code-button')).toHaveCount(0);
  });

  test('submit stays disabled until re-auth credential AND explicit confirm are provided', async ({
    page,
  }) => {
    await stubProfile(page, true);
    await openModal(page);

    const submit = page.getByTestId('delete-account-submit');
    await expect(submit).toBeDisabled();

    await page.getByTestId('delete-password-input').fill('hunter22');
    // Password alone is not enough — the confirm step is explicit.
    await expect(submit).toBeDisabled();

    await page.getByTestId('delete-confirm-checkbox').check();
    await expect(submit).toBeEnabled();

    await page.getByTestId('delete-confirm-checkbox').uncheck();
    await expect(submit).toBeDisabled();
  });

  test('surfaces the backend error for a wrong password and keeps the modal open', async ({
    page,
  }) => {
    await stubProfile(page, true);
    await page.route('**/api/me/delete*', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          message: 'Current password is incorrect',
        }),
      });
    });

    await openModal(page);
    await page.getByTestId('delete-password-input').fill('wrong-password');
    await page.getByTestId('delete-confirm-checkbox').check();
    await page.getByTestId('delete-account-submit').click();

    const error = page.getByTestId('delete-account-error');
    await expect(error).toBeVisible();
    await expect(error).toContainText(/incorrect/i);
    // Modal stays open, no success panel, still signed in on the page.
    await expect(page.getByTestId('delete-account-form')).toBeVisible();
    await expect(page.getByTestId('delete-account-success')).toHaveCount(0);
  });

  test('happy path shows grace-period messaging, clears scoped local state, and signs out', async ({
    page,
  }) => {
    await stubProfile(page, true);
    await page.route('**/api/me/delete*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: SUCCESS_BODY });
    });

    await openModal(page);

    // Seed the per-user key families the cleanup must remove (the consent +
    // popup-dismiss keys are already present via the shared e2e storage seed
    // and must SURVIVE).
    await page.evaluate(() => {
      localStorage.setItem('concierge_active_session_id', '42');
      localStorage.setItem('tip-review-drafts:7', '{}');
      localStorage.setItem('tip-review-skips:7', '{}');
    });

    await page.getByTestId('delete-password-input').fill('hunter22');
    await page.getByTestId('delete-confirm-checkbox').check();
    await page.getByTestId('delete-account-submit').click();

    // Grace-period messaging — "scheduled for deletion", never "deleted now".
    const success = page.getByTestId('delete-account-success');
    await expect(success).toBeVisible();
    await expect(success).toContainText(/deactivated/i);
    await expect(success).toContainText(/30 days/i);

    await page.getByTestId('delete-success-ok').click();

    // signOut({ callbackUrl: '/' }) lands on the home page.
    await page.waitForURL((url) => url.pathname === '/', { timeout: 15_000 });

    const storage = await page.evaluate(() => ({
      conciergeSession: localStorage.getItem('concierge_active_session_id'),
      reviewDrafts: localStorage.getItem('tip-review-drafts:7'),
      reviewSkips: localStorage.getItem('tip-review-skips:7'),
      tipLang: localStorage.getItem('tip-lang'),
      cookieConsent: localStorage.getItem('tip-cookie-consent'),
      popupDismiss: localStorage.getItem('tiyp_popup_dismiss_until_v2_en'),
    }));
    expect(storage.conciergeSession).toBeNull();
    expect(storage.reviewDrafts).toBeNull();
    expect(storage.reviewSkips).toBeNull();
    expect(storage.tipLang).toBeNull();
    // Device-level preferences are explicitly left untouched.
    expect(storage.cookieConsent).not.toBeNull();
    expect(storage.popupDismiss).not.toBeNull();
  });

  test('social-only accounts re-auth with a fresh account_deletion email OTP', async ({ page }) => {
    await stubProfile(page, false);

    let sentCodeType: string | undefined;
    await page.route('**/api/auth/send-verification*', async (route) => {
      sentCodeType = route.request().postDataJSON()?.code_type;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    let deletePayload: Record<string, unknown> | undefined;
    await page.route('**/api/me/delete*', async (route) => {
      deletePayload = route.request().postDataJSON();
      await route.fulfill({ status: 200, contentType: 'application/json', body: SUCCESS_BODY });
    });

    await openModal(page);
    // OTP mode: code input + send-code button, no password field.
    await expect(page.getByTestId('delete-password-input')).toHaveCount(0);
    await expect(page.getByTestId('delete-code-input')).toBeVisible();

    await page.getByTestId('send-code-button').click();
    await expect(page.getByTestId('delete-code-sent')).toBeVisible();
    expect(sentCodeType).toBe('account_deletion');

    await page.getByTestId('delete-code-input').fill('123456');
    await page.getByTestId('delete-confirm-checkbox').check();
    await page.getByTestId('delete-account-submit').click();

    await expect(page.getByTestId('delete-account-success')).toBeVisible();
    expect(deletePayload).toEqual({ verification_code: '123456' });
  });
});
