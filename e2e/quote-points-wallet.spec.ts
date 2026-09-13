import { test, expect, type Page } from '@playwright/test';
import { gotoPage } from './support/navigation';

/**
 * Quote-page points wallet panel (SMA-329).
 *
 * The per-credit stay-credit picker was replaced by partial wallet spend
 * under a per-booking cap: the panel shows the wallet balance, the max
 * applicable to THIS booking, and what's applied; the customer can apply
 * the max (default), a smaller amount (Q2(b)), or remove the points.
 *
 * Fully page.route-stubbed (like delete-account.spec.ts) so it runs with no
 * backend seed — it only needs the authed storage state for the client-side
 * session gate on /quotes/[id].
 */

const QUOTE_ID = 994329;

interface StubState {
  appliedPoints: number;
  lastApplyBody: unknown;
}

function discountLine(points: number) {
  const amount = (points / 100).toFixed(2);
  return {
    label: `Stay credit (${points.toLocaleString('en-US')} P)`,
    amount,
    kind: 'stay_credit',
  };
}

function bundleFor(state: StubState) {
  const points = state.appliedPoints;
  const discounts = points > 0 ? [discountLine(points)] : [];
  const total = (500 - points / 100).toFixed(2);
  return {
    quote: {
      id: QUOTE_ID,
      trip_id: 1,
      trip_version_id: 1,
      user_id: 1,
      current_quote_version_id: 1,
      status: 'SENT',
      schema_version: 1,
    },
    current_version: {
      id: 1,
      quote_id: QUOTE_ID,
      version_number: points > 0 ? 2 : 1,
      line_items: [
        {
          day_index: 0,
          item_index: 0,
          label: 'Suite, 2 nights',
          amount: '500.00',
          currency: 'USD',
        },
      ],
      total_snapshot: {
        currency: 'USD',
        subtotal: '500.00',
        fees: [],
        discounts,
        total,
      },
      applied_stay_credit_ids: [],
      applied_points: points,
      schema_version: 1,
    },
  };
}

function summaryFor(state: StubState) {
  const points = state.appliedPoints;
  return {
    balance_points: 20000,
    available_points: 18000,
    cap_points: 2500,
    cap_rate: '0.05',
    max_applicable_points: 2500,
    applied_points: points,
    currency: 'USD',
    applied_amount: (points / 100).toFixed(2),
    max_applicable_amount: '25.00',
  };
}

async function installStubs(page: Page, state: StubState) {
  // Trip context fetches are best-effort on the quote page — stub them out
  // so the spec never touches a real backend.
  await page.route('**/api/trip/**', (route) =>
    route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ success: false, message: 'not seeded' }),
    }),
  );

  await page.route(new RegExp(`/api/quotes/${QUOTE_ID}(\\?|$)`), (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: bundleFor(state) }),
    }),
  );

  await page.route(`**/api/quotes/${QUOTE_ID}/eligible-credits*`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: summaryFor(state) }),
    }),
  );

  await page.route(new RegExp(`/api/quotes/${QUOTE_ID}/credits(\\?|$)`), async (route) => {
    const request = route.request();
    if (request.method() === 'POST') {
      const body = request.postDataJSON() as { points?: number } | null;
      state.lastApplyBody = body;
      state.appliedPoints = body?.points ?? 2500;
    } else if (request.method() === 'DELETE') {
      state.appliedPoints = 0;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: bundleFor(state) }),
    });
  });
}

test.describe('Quote points wallet panel', () => {
  test('apply max drops the total; remove restores it', async ({ page }) => {
    const state: StubState = { appliedPoints: 0, lastApplyBody: null };
    await installStubs(page, state);

    await gotoPage(page, `/quotes/${QUOTE_ID}`);

    // Wallet panel renders balance + max applicable, input defaults to max.
    await expect(page.getByTestId('points-wallet-panel')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('wallet-balance')).toContainText('20,000 P');
    await expect(page.getByTestId('wallet-max')).toContainText('2,500 P');
    await expect(page.getByTestId('points-input')).toHaveValue('2500');
    await expect(page.getByTestId('quote-total')).toContainText('500');

    // Apply (default = max) → the total drops by the points value.
    await page.getByTestId('apply-points-button').click();
    await expect(page.getByTestId('applied-credit')).toContainText('2,500 P');
    await expect(page.getByTestId('quote-total')).toContainText('475');
    expect(state.lastApplyBody).toEqual({ points: 2500 });

    // Remove → the total restores.
    await page.getByTestId('remove-points-button').click();
    await expect(page.getByTestId('applied-credit')).toHaveCount(0);
    await expect(page.getByTestId('quote-total')).toContainText('500');
  });

  test('partial apply (amount < max) uses the chosen amount', async ({ page }) => {
    const state: StubState = { appliedPoints: 0, lastApplyBody: null };
    await installStubs(page, state);

    await gotoPage(page, `/quotes/${QUOTE_ID}`);

    const input = page.getByTestId('points-input');
    await expect(input).toHaveValue('2500', { timeout: 15_000 });
    await input.fill('1000');
    await page.getByTestId('apply-points-button').click();

    await expect(page.getByTestId('applied-credit')).toContainText('1,000 P');
    await expect(page.getByTestId('quote-total')).toContainText('490');
    expect(state.lastApplyBody).toEqual({ points: 1000 });
  });

  test('client-side validation blocks an over-max amount', async ({ page }) => {
    const state: StubState = { appliedPoints: 0, lastApplyBody: null };
    await installStubs(page, state);

    await gotoPage(page, `/quotes/${QUOTE_ID}`);

    const input = page.getByTestId('points-input');
    await expect(input).toHaveValue('2500', { timeout: 15_000 });
    await input.fill('9999');

    await expect(page.getByTestId('points-input-error')).toBeVisible();
    await expect(page.getByTestId('apply-points-button')).toBeDisabled();

    // "Use max" resets to a valid amount.
    await page.getByTestId('points-use-max').click();
    await expect(input).toHaveValue('2500');
    await expect(page.getByTestId('points-input-error')).toHaveCount(0);
    await expect(page.getByTestId('apply-points-button')).toBeEnabled();
  });
});
