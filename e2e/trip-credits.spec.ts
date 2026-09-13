import { test, expect } from '@playwright/test';
import { gotoPage } from './support/navigation';

// The /my-page/credits page is auth-gated; this spec runs in the
// chromium-authed project. We mock the backend proxy route so the test is
// deterministic and doesn't depend on seeded credits.

// Each trip yields a single post-trip grant: the user's first trip (55) earned
// the legacy first-trip bonus, and a later trip (66) earned trip points. No
// single trip carries both.
//
// Rows use the SMA-332 PointsLedgerResponse wire shape (see
// src/types/stay-credit.ts): the backend-derived `balance_points` plus every
// ledger row with `kind`/`delta_points`, newest first. The page renders the
// balance and rows verbatim — it never re-sums the ledger.
const TRIP_LINKED_LEDGER = {
  user_id: 1,
  balance_points: 10000,
  transactions: [
    {
      id: 101,
      user_id: 1,
      source: 'payment_points',
      status: 'issued',
      kind: 'grant',
      delta_points: 2000,
      amount_cents: 2000,
      currency: 'USD',
      source_ref: 'trip:66:tiered_earn',
      expires_at: '2028-05-01T00:00:00Z',
      created_at: '2026-05-01T00:00:00Z',
    },
    {
      id: 102,
      user_id: 1,
      source: 'first_trip_cashback',
      status: 'issued',
      kind: 'grant',
      delta_points: 3000,
      amount_cents: 3000,
      currency: 'USD',
      source_ref: 'trip:55:first_trip_3pct',
      expires_at: null,
      created_at: '2026-05-01T00:00:00Z',
    },
    {
      id: 103,
      user_id: 1,
      source: 'welcome',
      status: 'issued',
      kind: 'grant',
      delta_points: 5000,
      amount_cents: 5000,
      currency: 'USD',
      source_ref: null,
      expires_at: '2028-04-01T00:00:00Z',
      created_at: '2026-04-01T00:00:00Z',
    },
  ],
};

test.describe('Trip-linked credits on /my-page/credits', () => {
  test('post-trip credits show source labels and a View trip link', async ({ page }) => {
    await page.route('**/api/me/points', async (route) => {
      if (route.request().method() !== 'GET') return route.fallback();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, message: 'Success', data: TRIP_LINKED_LEDGER }),
      });
    });
    // Stub the benefit registry proxy (SMA-322) so the source labels are
    // deterministic: `payment_points` renders the registry's `tiered_earn`
    // copy, while `first_trip_cashback` (inactive — never in the payload)
    // degrades to its static fallback label. The hardcoded "— 2%"/"— 3%"
    // suffixes were removed in SMA-322 PR 3 (rates are tier-dependent).
    await page.route('**/api/benefits', async (route) => {
      if (route.request().method() !== 'GET') return route.fallback();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          message: 'Success',
          data: {
            benefits: [
              {
                key: 'point_unit',
                kind: 'unit_definition',
                unit: 'points',
                values_by_tier: { carte: '100', cercle: '100', confidence: '100', cenacle: '100' },
                copy: { en: 'TiP Points: 100 P = USD 1.', kr: 'TiP 포인트: 100 P = USD 1.' },
              },
              {
                key: 'tiered_earn',
                kind: 'earn_rate',
                unit: 'rate',
                values_by_tier: { carte: '0.001' },
                copy: {
                  en: 'Earn stay credit on every completed, reviewed trip.',
                  kr: '완료·리뷰된 여행마다 스테이 크레딧이 적립됩니다.',
                },
              },
            ],
            resolved: null,
          },
        }),
      });
    });
    // Stub the pending-earn projection (SMA-276) empty so the Pending
    // earnings section (which has its own "View trip →" links) can never
    // collide with the View-trip count asserted below.
    await page.route('**/api/me/credits/projected', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          message: 'Success',
          data: { user_id: 1, has_paid_trips: true, projections: [] },
        }),
      });
    });

    await gotoPage(page, '/my-page/credits');

    // ONE wallet balance in P (backend-derived) with the USD approximation
    // from the registry's point_unit (10,000 P / 100 = USD 100).
    await expect(page.getByTestId('points-balance')).toHaveText('10,000 P', { timeout: 15_000 });
    await expect(page.getByTestId('points-usd-approx')).toHaveText('≈ USD 100');

    // Registry copy for payment_points (from the stubbed payload); static
    // fallback label for the inactive first_trip_cashback source.
    await expect(page.getByText('Earn stay credit on every completed, reviewed trip.')).toBeVisible(
      { timeout: 15_000 },
    );
    await expect(page.getByText('First-trip bonus')).toBeVisible();

    // Both trip-linked credits link to their respective travel-history pages —
    // the first-trip bonus to trip 55 and the trip cashback to trip 66.
    const viewTripLinks = page.getByRole('link', { name: /View trip/i });
    await expect(viewTripLinks).toHaveCount(2);
    const hrefs = await viewTripLinks.evaluateAll((links) =>
      links.map((l) => l.getAttribute('href')),
    );
    expect(new Set(hrefs)).toEqual(
      new Set(['/my-page/travel-history/55', '/my-page/travel-history/66']),
    );

    // Every grant renders with an explicit + sign; the no-expiry lot reads
    // "No expiry" (never blank).
    await expect(page.getByTestId('points-delta')).toHaveText(['+2,000 P', '+3,000 P', '+5,000 P']);
    await expect(page.getByTestId('points-expiry').nth(1)).toContainText('No expiry');

    // The welcome credit has no trip linkage, so it shows no View trip link.
    await expect(page.getByText('Welcome', { exact: true })).toBeVisible();
  });
});
