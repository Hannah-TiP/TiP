import { test, expect, type Page } from '@playwright/test';
import { gotoPage } from './support/navigation';

/**
 * Live points policy visible to members (SMA-359) — fully page.route-stubbed
 * so it runs with no backend seed (chromium-authed project: the wallet and
 * review-session pages live under /my-page).
 *
 * The registry payload (GET /api/benefits proxy) carries the tier-agnostic
 * policy entries; every surface must also degrade to figure-free copy when
 * they are absent (older backend).
 */

const TRIP_ID = 778;

function envelope(data: unknown): string {
  return JSON.stringify({ code: 200, message: 'Success', data });
}

function policyEntry(key: string, unit: string, value: string) {
  return {
    key,
    kind: 'one_off_grant',
    unit,
    values_by_tier: { carte: value, cercle: value, confidence: value, cenacle: value },
    copy: { en: key, kr: key },
  };
}

const POLICY_BENEFITS = {
  benefits: [
    policyEntry('review_reward_text', 'points', '500'),
    policyEntry('review_reward_photo', 'points', '1000'),
    policyEntry('point_validity_months', 'months', '24'),
    policyEntry('redemption_cap', 'rate', '0.05'),
  ],
  resolved: null,
};

const LEDGER = {
  user_id: 1,
  balance_points: 1500,
  transactions: [
    {
      id: 302,
      user_id: 1,
      source: 'review_reward',
      status: 'issued',
      kind: 'grant',
      delta_points: 1000,
      notes: 'photo',
      expires_at: '2028-05-10T00:00:00Z',
      created_at: '2026-05-10T00:00:00Z',
    },
    {
      id: 301,
      user_id: 1,
      source: 'review_reward',
      status: 'issued',
      kind: 'grant',
      delta_points: 500,
      notes: 'text',
      expires_at: null,
      created_at: '2026-05-01T00:00:00Z',
    },
  ],
};

async function stubBenefits(page: Page, payload: unknown) {
  await page.route('**/api/benefits', async (route) => {
    if (route.request().method() !== 'GET') return route.fallback();
    await route.fulfill({ status: 200, contentType: 'application/json', body: envelope(payload) });
  });
}

async function stubWallet(page: Page) {
  await page.route('**/api/me/points', async (route) => {
    if (route.request().method() !== 'GET') return route.fallback();
    await route.fulfill({ status: 200, contentType: 'application/json', body: envelope(LEDGER) });
  });
  await page.route('**/api/me/credits/projected', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: envelope({ user_id: 1, has_paid_trips: false, projections: [] }),
    });
  });
}

async function stubReviewSession(page: Page) {
  await page.route(new RegExp(`/api/trip/${TRIP_ID}(\\?|$)`), (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: envelope({
        trip: {
          id: TRIP_ID,
          user_id: 9,
          status: 'travel-completed',
          current_trip_version_id: 1,
          schema_version: 1,
        },
        active_quote: null,
      }),
    }),
  );
  await page.route(new RegExp(`/api/trip/${TRIP_ID}/current-version(\\?|$)`), (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: envelope({
        id: 1,
        trip_id: TRIP_ID,
        title: 'Tokyo Escape',
        start_date: '2026-07-01',
        end_date: '2026-07-05',
        adults: 2,
        kids: 0,
        schema_version: 1,
        plan: [
          {
            date: '2026-07-01',
            items: [{ item_type: 'hotel', hotel_id: 10, title: 'Aman Tokyo' }],
          },
        ],
      }),
    }),
  );
  await page.route(/\/api\/profile(\?|$)/, (route) => {
    if (route.request().method() !== 'GET') return route.fallback();
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: envelope({ id: 9, email: 'tester@example.com', travel_styles: [] }),
    });
  });
  await page.route(/\/api\/reviews\/by-entity\/hotel\/10(\?|$)/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: envelope({ reviews: [], aggregate: { average_rating: null, review_count: 0 } }),
    }),
  );
}

test.describe('Points policy visible to members (SMA-359)', () => {
  test('wallet: validity footnote + photo/text review-reward labels from the registry', async ({
    page,
  }) => {
    await stubBenefits(page, POLICY_BENEFITS);
    await stubWallet(page);

    await gotoPage(page, '/my-page/credits');

    await expect(page.getByTestId('points-validity-footnote')).toHaveText(
      'Points expire 24 months after they are earned.',
    );
    const rows = page.getByTestId('points-row');
    await expect(rows).toHaveCount(2);
    // Registry copy for the matching policy entry wins (stubbed as the key).
    await expect(rows.nth(0)).toContainText('review_reward_photo');
    await expect(rows.nth(1)).toContainText('review_reward_text');
    // The variant marker never renders as a free-text note.
    await expect(rows.nth(0)).not.toContainText(/\bphoto\b(?!_)/);
    // A NULL-expiry lot still reads "No expiry".
    await expect(rows.nth(1).getByTestId('points-expiry')).toContainText('No expiry');
  });

  test('wallet: no validity sentence and static labels without the policy entries', async ({
    page,
  }) => {
    await stubBenefits(page, { benefits: [], resolved: null });
    await stubWallet(page);

    await gotoPage(page, '/my-page/credits');

    const rows = page.getByTestId('points-row');
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0)).toContainText('Photo Review');
    await expect(rows.nth(1)).toContainText('Review Reward');
    await expect(page.getByTestId('points-validity-footnote')).toHaveCount(0);
  });

  test('review session: pre-submit intro quotes the reward amounts', async ({ page }) => {
    await stubBenefits(page, POLICY_BENEFITS);
    await stubReviewSession(page);

    await gotoPage(page, `/my-page/travel-history/${TRIP_ID}/reviews`);

    await expect(page.getByTestId('review-reward-intro')).toHaveText(
      'Earn 500 P after approval — 1,000 P if you add a photo.',
    );
  });

  test('review session: figure-free intro without the reward entries', async ({ page }) => {
    await stubBenefits(page, { benefits: [], resolved: null });
    await stubReviewSession(page);

    await gotoPage(page, `/my-page/travel-history/${TRIP_ID}/reviews`);

    await expect(page.getByTestId('review-reward-intro')).toHaveText(
      'Approved reviews earn TiP Points.',
    );
  });
});
