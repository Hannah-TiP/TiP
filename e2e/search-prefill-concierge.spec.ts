import { test, expect } from '@playwright/test';
import { gotoPage } from './support/navigation';

/**
 * E2E: Home SearchBar → /concierge prefilled and seeded (authenticated).
 *
 * Runs against the `chromium-authed` project so the SearchBar click
 * lands directly on /concierge instead of bouncing to /sign-in. All
 * backend traffic is mocked at the proxy layer.
 *
 * The unauth → sign-in redirect flow lives in
 * `search-prefill-redirect.spec.ts` so each spec runs with the right
 * storageState.
 */

const TRIP_ID = 4242;
const SESSION_ID = 7777;

const createdTrip = {
  id: TRIP_ID,
  user_id: 1,
  status: 'draft',
  current_trip_version_id: 1,
  schema_version: 1,
};

const createdSession = {
  id: SESSION_ID,
  user_id: 1,
  trip_id: TRIP_ID,
  status: 'ai',
  last_message_at: null,
  schema_version: 1,
};

const seededVersion = {
  id: 1,
  trip_id: TRIP_ID,
  version_number: 1,
  title: 'Paris',
  summary: 'A leisure getaway to Paris',
  start_date: '2099-06-01',
  end_date: '2099-06-07',
  adults: 2,
  kids: 1,
  plan: [],
  schema_version: 1,
};

test.describe('SearchBar → Concierge prefill (authed)', () => {
  test.beforeEach(async ({ context }) => {
    // Since SMA-91 the DestinationDropdown hits the unified, bookable-only
    // `/api/destinations/search` (not `/api/cities`); a blank query returns
    // the "popular" set, so this single Paris city renders as soon as the
    // dropdown opens. `id: 7` + `type: 'city'` make the prefill carry
    // `cityId=7&city=Paris&destinationType=city`.
    await context.route('**/api/destinations/search**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: 7,
              type: 'city',
              name: { en: 'Paris', kr: '파리' },
              slug: 'paris',
              region_name: { en: 'Ile-de-France', kr: '일드프랑스' },
              country_name: { en: 'France', kr: '프랑스' },
            },
          ],
        }),
      });
    });

    let sessionsList: Array<Record<string, unknown>> = [];

    await context.route('**/api/ai-chat/sessions', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: sessionsList }),
      });
    });

    await context.route('**/api/trip/create*', async (route) => {
      sessionsList = [{ session: createdSession, trip: createdTrip }];
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: createdTrip }),
      });
    });

    await context.route('**/api/ai-chat/create-session-for-trip', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: createdSession }),
      });
    });

    await context.route(`**/api/trip/${TRIP_ID}*`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        // GET /trip/{id} returns the TripWithActiveQuote bundle now, not bare Trip.
        body: JSON.stringify({ data: { trip: createdTrip, active_quote: null } }),
      });
    });

    await context.route(`**/api/trip/${TRIP_ID}/current-version*`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: seededVersion }),
      });
    });

    let lastSeed = '';
    await context.route(`**/api/ai-chat/trips/${TRIP_ID}/messages`, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: lastSeed
              ? [
                  {
                    id: 1,
                    user_id: 1,
                    trip_id: TRIP_ID,
                    role: 'user',
                    message_type: 'text',
                    content: lastSeed,
                    schema_version: 1,
                  },
                ]
              : [],
          }),
        });
        return;
      }

      const body = JSON.parse(route.request().postData() || '{}');
      lastSeed = String(body.content ?? '');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            user_message: {
              id: 1,
              user_id: 1,
              trip_id: TRIP_ID,
              role: 'user',
              message_type: 'text',
              content: lastSeed,
              schema_version: 1,
            },
            assistant_message: null,
          },
        }),
      });
    });
  });

  test('SearchBar click lands on /concierge with TripDetailPanel prefilled and URL cleaned', async ({
    page,
  }) => {
    await gotoPage(page, '/');
    // Label renders as "DESTINATION" via CSS `uppercase`, but the DOM text
    // node is "Destination" (i18n value); match the actual text content.
    await page.getByText('Destination', { exact: true }).click();
    await page.getByText('Paris').click();
    await page.getByRole('button', { name: /plan my trip/i }).click();

    await page.waitForURL(/\/concierge/, { timeout: 15_000 });

    const summaryRow = page.getByTestId('trip-row-summary');
    await expect(summaryRow).toBeVisible({ timeout: 15_000 });
    await expect(summaryRow).toContainText('A leisure getaway to Paris');

    // URL gets cleaned up after the prefill is consumed.
    await page.waitForURL((u) => u.pathname === '/concierge' && u.search === '', {
      timeout: 15_000,
    });
  });
});
