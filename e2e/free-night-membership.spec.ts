import { test, expect } from '@playwright/test';
import { gotoPage } from './support/navigation';

// The /my-page/membership page is auth-gated; this spec runs in the
// chromium-authed project. We mock the /api/me/free-nights proxy so the test
// is deterministic and doesn't depend on seeded accrual data.

type FreeNightSummary = {
  tier: string | null;
  accrues: boolean;
  threshold: number | null;
  current_nights: number | null;
  nights_to_next: number | null;
  awarded: unknown[];
};

async function stubFreeNights(page: import('@playwright/test').Page, data: FreeNightSummary) {
  await page.route('**/api/me/free-nights', async (route) => {
    if (route.request().method() !== 'GET') return route.fallback();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 200, message: 'Success', data }),
    });
  });
}

test.describe('Free-night section on /my-page/membership', () => {
  test('Confidence member sees accrual progress', async ({ page }) => {
    await stubFreeNights(page, {
      tier: 'confidence',
      accrues: true,
      threshold: 10,
      current_nights: 6,
      nights_to_next: 4,
      awarded: [],
    });

    await gotoPage(page, '/my-page/membership');

    const section = page.getByTestId('free-night-summary');
    await expect(section).toBeVisible({ timeout: 15_000 });
    await expect(section).toContainText('6 of 10 nights');
    await expect(section).toContainText('4 more nights');
    await expect(page.getByTestId('free-night-progress-bar')).toBeVisible();
  });

  test('Confidence member sees awarded free nights', async ({ page }) => {
    await stubFreeNights(page, {
      tier: 'confidence',
      accrues: true,
      threshold: 10,
      current_nights: 0,
      nights_to_next: 10,
      awarded: [
        {
          id: 1,
          user_id: 9,
          tier_at_award: 'confidence',
          kind: 'awarded',
          status: 'awarded',
          accrual_period: 2026,
          qualifying_nights: 10,
          awarded_at: '2026-06-01T00:00:00Z',
          redeemed_at: null,
          fulfilled_by_admin_id: null,
          source_ref: 'award:confidence:trip:1:2026:0',
          notes: 'trip:1',
          schema_version: 1,
          created_at: '2026-06-01T00:00:00Z',
          updated_at: null,
        },
      ],
    });

    await gotoPage(page, '/my-page/membership');

    await expect(page.getByTestId('free-night-summary')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('free-night-awarded-list')).toBeVisible();
    await expect(page.getByTestId('free-night-awarded-list')).toContainText('Available');
  });

  test('Carte member sees no free-night section', async ({ page }) => {
    await stubFreeNights(page, {
      tier: 'carte',
      accrues: false,
      threshold: null,
      current_nights: null,
      nights_to_next: null,
      awarded: [],
    });

    await gotoPage(page, '/my-page/membership');

    // The membership page still renders (brand heading), but the free-night
    // section is absent for a non-accruing tier.
    await expect(page.getByRole('heading', { name: 'Les Quatre Cercles' })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId('free-night-summary')).toHaveCount(0);
  });
});
