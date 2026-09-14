import { test, expect, type Page } from '@playwright/test';
import { gotoPage } from './support/navigation';

/**
 * Review-reward clawback on self-delete (SMA-363) — fully page.route-stubbed
 * so it runs with no backend seed (chromium-authed project: both surfaces
 * live under /my-page).
 *
 * 1. Deleting an APPROVED review from the session page first shows a confirm
 *    quoting the unconsumed review reward read from the wallet.
 * 2. The wallet labels the resulting clawback row "Review deleted" and never
 *    shows the raw `review_deleted` marker.
 */

const TRIP_ID = 779;
const REVIEW_ID = 910;

function envelope(data: unknown): string {
  return JSON.stringify({ code: 200, message: 'Success', data });
}

function fulfill(data: unknown) {
  return { status: 200, contentType: 'application/json', body: envelope(data) };
}

const REWARD_GRANT = {
  id: 401,
  user_id: 9,
  source: 'review_reward',
  status: 'issued',
  kind: 'grant',
  delta_points: 500,
  notes: 'text',
  trip_id: TRIP_ID,
  expires_at: '2028-05-01T00:00:00Z',
  created_at: '2026-05-01T00:00:00Z',
};

const REVIEW_DELETED_CLAWBACK = {
  id: 402,
  user_id: 9,
  source: 'review_reward',
  status: 'issued',
  kind: 'clawback',
  delta_points: -500,
  consumes_transaction_id: 401,
  notes: 'review_deleted',
  trip_id: TRIP_ID,
  expires_at: null,
  created_at: '2026-05-02T00:00:00Z',
};

async function stubWallet(page: Page, transactions: unknown[], balance: number) {
  await page.route('**/api/me/points', async (route) => {
    if (route.request().method() !== 'GET') return route.fallback();
    await route.fulfill(fulfill({ user_id: 9, balance_points: balance, transactions }));
  });
  await page.route('**/api/me/credits/projected', (route) =>
    route.fulfill(fulfill({ user_id: 9, has_paid_trips: false, projections: [] })),
  );
  await page.route('**/api/benefits', async (route) => {
    if (route.request().method() !== 'GET') return route.fallback();
    await route.fulfill(fulfill({ benefits: [], resolved: null }));
  });
}

async function stubReviewSession(page: Page) {
  await page.route(new RegExp(`/api/trip/${TRIP_ID}(\\?|$)`), (route) =>
    route.fulfill(
      fulfill({
        trip: {
          id: TRIP_ID,
          user_id: 9,
          status: 'travel-completed',
          current_trip_version_id: 1,
          schema_version: 1,
        },
        active_quote: null,
      }),
    ),
  );
  await page.route(new RegExp(`/api/trip/${TRIP_ID}/current-version(\\?|$)`), (route) =>
    route.fulfill(
      fulfill({
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
    ),
  );
  await page.route(/\/api\/profile(\?|$)/, (route) => {
    if (route.request().method() !== 'GET') return route.fallback();
    return route.fulfill(fulfill({ id: 9, email: 'tester@example.com', travel_styles: [] }));
  });
  await page.route(/\/api\/reviews\/by-entity\/hotel\/10(\?|$)/, (route) =>
    route.fulfill(
      fulfill({
        reviews: [
          {
            review: {
              id: REVIEW_ID,
              author_user_id: 9,
              trip_id: TRIP_ID,
              entity_type: 'hotel',
              entity_id: 10,
              rating: 5,
              moderation_status: 'visible',
              locked_at: null,
              deleted_at: null,
              comment: 'Loved it',
              photos: [],
              schema_version: 1,
              created_at: '2026-07-10T00:00:00Z',
              updated_at: null,
            },
            author: { id: 9, first_name: 'Ada', last_name: 'L' },
          },
        ],
        aggregate: { average_rating: 5, review_count: 1 },
      }),
    ),
  );
}

test.describe('Review-reward clawback on self-delete (SMA-363)', () => {
  test('session: deleting an approved review confirms with the reward figure first', async ({
    page,
  }) => {
    await stubReviewSession(page);
    await stubWallet(page, [REWARD_GRANT], 500);
    let deleteCalls = 0;
    await page.route(new RegExp(`/api/reviews/${REVIEW_ID}(\\?|$)`), async (route) => {
      if (route.request().method() !== 'DELETE') return route.fallback();
      deleteCalls += 1;
      await route.fulfill(fulfill(null));
    });

    await gotoPage(page, `/my-page/travel-history/${TRIP_ID}/reviews`);

    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    const confirm = page.getByTestId('delete-review-confirm');
    await expect(confirm).toBeVisible();
    await expect(page.getByTestId('delete-review-confirm-message')).toHaveText(
      'Deleting this review removes the 500 P you earned for it.',
    );
    expect(deleteCalls).toBe(0);

    // Keep review → nothing deleted.
    await page.getByRole('button', { name: 'Keep review' }).click();
    await expect(confirm).toHaveCount(0);
    expect(deleteCalls).toBe(0);

    // Confirm → the DELETE fires.
    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    await page.getByTestId('delete-review-confirm-submit').click();
    await expect.poll(() => deleteCalls).toBe(1);
    await expect(page.getByTestId('delete-review-confirm')).toHaveCount(0);
  });

  test('wallet: the clawback row reads "Review deleted" and hides the marker', async ({ page }) => {
    await stubWallet(page, [REVIEW_DELETED_CLAWBACK, REWARD_GRANT], 0);

    await gotoPage(page, '/my-page/credits');

    const rows = page.getByTestId('points-row');
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0).getByTestId('points-kind')).toHaveText('Review deleted');
    await expect(rows.nth(0)).not.toContainText('review_deleted');
    await expect(rows.nth(0).getByTestId('points-delta')).toHaveText('−500 P');
    await expect(rows.nth(1).getByTestId('points-kind')).toHaveCount(0);
  });
});
