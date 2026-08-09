import { test, expect } from '@playwright/test';
import { gotoPage } from './support/navigation';

// The /my-page/credits page is auth-gated; this spec runs in the
// chromium-authed project. We mock the backend proxy route so the test is
// deterministic and doesn't depend on seeded credits.
//
// SMA-98: a redeemed promo-code credit must surface BOTH the localized source
// label AND the promo code itself (e.g. "프로모션 코드 · WELCOME26"), plus the
// admin's user-facing description in the notes column. Older promo credits with
// no structured promo_code must still render (label only, no crash).

const PROMO_CREDITS = [
  {
    id: 201,
    user_id: 1,
    source: 'promo_code_redemption',
    status: 'issued',
    amount_cents: 10000,
    currency: 'USD',
    source_ref: null,
    promo_code: 'WELCOME26',
    notes: 'Welcome aboard — enjoy your credit!',
    created_at: '2026-05-10T00:00:00Z',
  },
  {
    id: 202,
    user_id: 1,
    source: 'promo_code_redemption',
    status: 'issued',
    amount_cents: 5000,
    currency: 'USD',
    source_ref: null,
    // Old entry created before this change — no promo_code / notes.
    promo_code: null,
    notes: null,
    created_at: '2026-01-01T00:00:00Z',
  },
];

test.describe('Promo-code credit history on /my-page/credits', () => {
  test('redeemed promo credit shows the code + description; old entry is label-only', async ({
    page,
  }) => {
    await page.route('**/api/me/credits', async (route) => {
      if (route.request().method() !== 'GET') return route.fallback();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, message: 'Success', data: PROMO_CREDITS }),
      });
    });
    // Stub the pending-earn projection (SMA-276) empty so the section stays
    // hidden and this spec stays hermetic.
    await page.route('**/api/me/credits/projected', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          message: 'Success',
          data: { user_id: 1, has_paid_trips: false, projections: [] },
        }),
      });
    });

    await gotoPage(page, '/my-page/credits');

    // The localized source label renders (English in the default project).
    await expect(page.getByText('Promo Code', { exact: true }).first()).toBeVisible({
      timeout: 15_000,
    });

    // The newer credit surfaces the actual code as a sub-label.
    await expect(page.getByText('WELCOME26')).toBeVisible();
    // ...and the admin's user-facing description rides through the notes column.
    await expect(page.getByText('Welcome aboard — enjoy your credit!')).toBeVisible();

    // The old entry (no promo_code) renders the label only — the code text only
    // appears once on the page (for the newer credit).
    await expect(page.getByText('WELCOME26')).toHaveCount(1);
  });
});
