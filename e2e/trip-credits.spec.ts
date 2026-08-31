import { test, expect } from '@playwright/test';
import { gotoPage } from './support/navigation';

// The /my-page/credits page is auth-gated; this spec runs in the
// chromium-authed project. We mock the backend proxy route so the test is
// deterministic and doesn't depend on seeded credits.

// Each trip yields a single post-trip credit: the user's first trip (55) earns
// the 3% first-trip bonus, and a later trip (66) earns the 2% trip cashback. No
// single trip carries both.
const TRIP_LINKED_CREDITS = [
  {
    id: 101,
    user_id: 1,
    source: 'payment_points',
    status: 'issued',
    amount_cents: 2000,
    currency: 'USD',
    source_ref: 'trip:66:payment_2pct',
    created_at: '2026-05-01T00:00:00Z',
  },
  {
    id: 102,
    user_id: 1,
    source: 'first_trip_cashback',
    status: 'issued',
    amount_cents: 3000,
    currency: 'USD',
    source_ref: 'trip:55:first_trip_3pct',
    created_at: '2026-05-01T00:00:00Z',
  },
  {
    id: 103,
    user_id: 1,
    source: 'welcome',
    status: 'issued',
    amount_cents: 5000,
    currency: 'USD',
    source_ref: null,
    created_at: '2026-04-01T00:00:00Z',
  },
];

test.describe('Trip-linked credits on /my-page/credits', () => {
  test('post-trip credits show source labels and a View trip link', async ({ page }) => {
    await page.route('**/api/me/credits', async (route) => {
      if (route.request().method() !== 'GET') return route.fallback();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, message: 'Success', data: TRIP_LINKED_CREDITS }),
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

    // The welcome credit has no trip linkage, so it shows no View trip link.
    // Match the credit-row label exactly so it doesn't collide with the page's
    // "Welcome gifts, birthday credits…" intro copy.
    await expect(page.getByText('Welcome', { exact: true })).toBeVisible();
  });
});
