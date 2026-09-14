import { test, expect } from '@playwright/test';
import { gotoPage } from './support/navigation';

// Member-facing pending-earnings visibility (SMA-276; P-denominated and
// completion-based since SMA-358). The /my-page/credits page is auth-gated;
// this spec runs in the chromium-authed project. All proxy routes are
// page.route-stubbed so the spec is hermetic — including the benefit
// registry, whose `point_unit` entry drives the "≈ USD" line.

const PROJECTIONS = [
  {
    trip_id: 55,
    trip_title: 'Kyoto Escape',
    eligible_spend_cents: 100000,
    currency: 'USD',
    tier_rate: 0.005,
    projected_amount_cents: 500,
    projected_points: 500,
    blocking_reason: 'awaiting_completion',
  },
  {
    trip_id: 66,
    trip_title: 'Nice in Autumn',
    eligible_spend_cents: 200000,
    currency: 'USD',
    tier_rate: 0.005,
    projected_amount_cents: 1000,
    projected_points: 1000,
    blocking_reason: 'trip_not_finished',
  },
];

// Registry payload: only the structural `point_unit` entry (100 P = 1 USD)
// matters here — it makes the USD approximation deterministic.
const BENEFITS_PAYLOAD = {
  benefits: [
    {
      key: 'point_unit',
      kind: 'unit_definition',
      unit: 'points',
      values_by_tier: { carte: '100', cercle: '100', confidence: '100', cenacle: '100' },
      copy: { en: 'x', kr: 'x' },
    },
  ],
  resolved: null,
};

async function stubCredits(page: import('@playwright/test').Page, projections: unknown[]) {
  await page.route('**/api/benefits', async (route) => {
    if (route.request().method() !== 'GET') return route.fallback();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 200, message: 'Success', data: BENEFITS_PAYLOAD }),
    });
  });
  await page.route('**/api/me/points', async (route) => {
    if (route.request().method() !== 'GET') return route.fallback();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 200,
        message: 'Success',
        data: { user_id: 1, balance_points: 0, transactions: [] },
      }),
    });
  });
  await page.route('**/api/me/credits/projected', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 200,
        message: 'Success',
        data: { user_id: 1, has_paid_trips: projections.length > 0, projections },
      }),
    });
  });
}

test.describe('Pending earnings on /my-page/credits', () => {
  test('pending trips render P estimates, USD approximation and per-blocker CTA links', async ({
    page,
  }) => {
    await stubCredits(page, PROJECTIONS);

    await gotoPage(page, '/my-page/credits');

    const section = page.getByTestId('pending-earnings');
    await expect(section).toBeVisible({ timeout: 15_000 });

    // Awaiting-completion trip: points accrue automatically on the
    // completion pass; the review is a SEPARATE reward with its own CTA.
    const kyoto = section.getByTestId('pending-earning-row').filter({ hasText: 'Kyoto Escape' });
    await expect(kyoto).toBeVisible();
    await expect(kyoto.getByTestId('pending-points')).toHaveText('+500 P');
    await expect(kyoto.getByTestId('pending-usd-approx')).toHaveText('≈ USD 5');
    await expect(
      kyoto.getByText('500 P is on its way — added automatically now that your trip has ended'),
    ).toBeVisible();
    await expect(kyoto.getByText('Writing a review earns a separate reward.')).toBeVisible();
    await expect(kyoto.getByRole('link', { name: /Write a review/i })).toHaveAttribute(
      'href',
      '/my-page/travel-history/55/reviews',
    );
    await expect(kyoto.getByRole('link', { name: /View trip/i })).toHaveAttribute(
      'href',
      '/my-page/travel-history/55',
    );

    // Not-finished trip: estimate + view-trip CTA only — no review CTA
    // before the trip has ended.
    const nice = section.getByTestId('pending-earning-row').filter({ hasText: 'Nice in Autumn' });
    await expect(nice).toBeVisible();
    await expect(nice.getByTestId('pending-points')).toHaveText('+1,000 P');
    await expect(nice.getByTestId('pending-usd-approx')).toHaveText('≈ USD 10');
    await expect(
      nice.getByText("You'll earn an estimated 1,000 P automatically after this trip ends"),
    ).toBeVisible();
    await expect(nice.getByRole('link', { name: /Write a review/i })).toHaveCount(0);
    await expect(nice.getByRole('link', { name: /View trip/i })).toHaveAttribute(
      'href',
      '/my-page/travel-history/66',
    );

    // No currency-denominated estimate survives anywhere in the section.
    await expect(section).not.toContainText('~USD');

    // Estimates never leak into the balance card: with an empty ledger the
    // wallet still reads 0 P.
    await expect(page.getByTestId('points-balance')).toHaveText('0 P');
    await expect(page.getByTestId('points-empty')).toBeVisible();
  });

  test('section is absent when the member has no pending projections', async ({ page }) => {
    await stubCredits(page, []);

    await gotoPage(page, '/my-page/credits');

    // Wait for the page to settle (history card shows its empty state), then
    // assert the pending section never rendered.
    await expect(page.getByText('Point history')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('pending-earnings')).toHaveCount(0);
  });
});
