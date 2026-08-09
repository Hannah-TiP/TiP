import { test, expect } from '@playwright/test';
import { gotoPage } from './support/navigation';

// Member-facing pending-earnings visibility (SMA-276). The /my-page/credits
// page is auth-gated; this spec runs in the chromium-authed project. All
// proxy routes are page.route-stubbed so the spec is hermetic.

const PROJECTIONS = [
  {
    trip_id: 55,
    trip_title: 'Kyoto Escape',
    eligible_spend_cents: 100000,
    currency: 'USD',
    tier_rate: 0.005,
    projected_amount_cents: 500,
    blocking_reason: 'awaiting_review',
  },
  {
    trip_id: 66,
    trip_title: 'Nice in Autumn',
    eligible_spend_cents: 200000,
    currency: 'USD',
    tier_rate: 0.005,
    projected_amount_cents: 1000,
    blocking_reason: 'trip_not_finished',
  },
];

async function stubCredits(page: import('@playwright/test').Page, projections: unknown[]) {
  await page.route('**/api/me/credits', async (route) => {
    if (route.request().method() !== 'GET') return route.fallback();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 200, message: 'Success', data: [] }),
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
  test('pending trips render with ~estimates and per-blocker CTA links', async ({ page }) => {
    await stubCredits(page, PROJECTIONS);

    await gotoPage(page, '/my-page/credits');

    const section = page.getByTestId('pending-earnings');
    await expect(section).toBeVisible({ timeout: 15_000 });

    // Awaiting-review trip: ~amount + review CTA to the reviews session.
    // exact: true — the amount also appears inside the blocker copy
    // ("Review this trip to earn ~USD 5.00"), so a substring match would
    // resolve to 2 elements under strict mode.
    await expect(section.getByText('Kyoto Escape')).toBeVisible();
    await expect(section.getByText('~USD 5.00', { exact: true })).toBeVisible();
    await expect(section.getByText('Review this trip to earn ~USD 5.00')).toBeVisible();
    await expect(section.getByRole('link', { name: /Write a review/i })).toHaveAttribute(
      'href',
      '/my-page/travel-history/55/reviews',
    );

    // Not-finished trip: ~amount + view-trip CTA to the trip page.
    await expect(section.getByText('Nice in Autumn')).toBeVisible();
    await expect(section.getByText('~USD 10.00', { exact: true })).toBeVisible();
    await expect(section.getByRole('link', { name: /View trip/i })).toHaveAttribute(
      'href',
      '/my-page/travel-history/66',
    );

    // Estimates never leak into the balance card: with no issued credits the
    // balance still reads the empty state.
    await expect(page.getByText('No credits yet').first()).toBeVisible();
  });

  test('section is absent when the member has no pending projections', async ({ page }) => {
    await stubCredits(page, []);

    await gotoPage(page, '/my-page/credits');

    // Wait for the page to settle (history card shows its empty state), then
    // assert the pending section never rendered.
    await expect(page.getByText('Credit history')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('pending-earnings')).toHaveCount(0);
  });
});
