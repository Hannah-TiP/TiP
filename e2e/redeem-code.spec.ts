import { test, expect } from '@playwright/test';
import { gotoPage } from './support/navigation';

// The /my-page/credits page is auth-gated; this spec runs in the
// chromium-authed project. We mock the backend proxy routes so the test is
// deterministic and doesn't depend on seeded promo codes.

async function stubCreditsList(page: import('@playwright/test').Page) {
  await page.route('**/api/me/credits', async (route) => {
    if (route.request().method() !== 'GET') return route.fallback();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 200, message: 'Success', data: [] }),
    });
  });
}

test.describe('Redeem promo code on /my-page/credits', () => {
  test('happy path: non-USD code credits the wallet', async ({ page }) => {
    await stubCreditsList(page);
    await page.route('**/api/me/credits/redeem-code', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          message: 'Success',
          data: { credited_amount: '150.00', currency: 'EUR', credit_id: 9 },
        }),
      });
    });

    await gotoPage(page, '/my-page/credits');

    const section = page.getByTestId('redeem-code-section');
    await expect(section).toBeVisible({ timeout: 15_000 });

    await page.getByTestId('redeem-code-input').fill('LOTTE-VIP');
    await page.getByTestId('redeem-code-submit').click();

    const success = page.getByTestId('redeem-code-success');
    await expect(success).toBeVisible({ timeout: 10_000 });
    await expect(success).toContainText('150');
    await expect(success).toContainText('€');
  });

  const errorCases: { status: number; bodyCode: number; expect: RegExp }[] = [
    { status: 404, bodyCode: 4041, expect: /doesn't exist/i },
    { status: 400, bodyCode: 4001, expect: /no longer active/i },
    { status: 400, bodyCode: 4002, expect: /expired/i },
    { status: 400, bodyCode: 4003, expect: /redemption limit/i },
    { status: 400, bodyCode: 4004, expect: /already redeemed/i },
  ];

  for (const c of errorCases) {
    test(`error path: backend ${c.bodyCode} shows a distinct message`, async ({ page }) => {
      await stubCreditsList(page);
      await page.route('**/api/me/credits/redeem-code', async (route) => {
        await route.fulfill({
          status: c.status,
          contentType: 'application/json',
          body: JSON.stringify({ code: c.bodyCode, message: 'nope' }),
        });
      });

      await gotoPage(page, '/my-page/credits');
      await expect(page.getByTestId('redeem-code-section')).toBeVisible({
        timeout: 15_000,
      });

      await page.getByTestId('redeem-code-input').fill('SOME-CODE');
      await page.getByTestId('redeem-code-submit').click();

      const error = page.getByTestId('redeem-code-error');
      await expect(error).toBeVisible({ timeout: 10_000 });
      await expect(error).toContainText(c.expect);
    });
  }
});
