import { test, expect, type Route } from '@playwright/test';

/**
 * /more-dreams — independent infinite scroll for Activities + Restaurants and a
 * SERVER-SIDE city filter (SMA-73).
 *
 *   - Each grid paginates independently (own sentinel + has_more).
 *   - Selecting a city sends a `city_id` query param and resets both grids to
 *     page 1.
 *   - Each grid shows its own "No more results" footer at the end.
 */

function activityFixture(id: number) {
  return {
    id,
    slug: `activity-${id}`,
    kind: 'local_experience',
    status: 'published',
    city_id: 10,
    name: { en: `Activity ${id}`, kr: `Activity ${id}` },
    images: [
      {
        original:
          'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop',
      },
    ],
    schema_version: 1,
  };
}

function restaurantFixture(id: number) {
  return {
    id,
    slug: `restaurant-${id}`,
    status: 'published',
    city_id: 10,
    name: { en: `Restaurant ${id}`, kr: `Restaurant ${id}` },
    images: [
      {
        original:
          'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop',
      },
    ],
    schema_version: 1,
  };
}

function envelope<T>(
  items: T[],
  opts: { total: number; per_page: number; current_page: number; has_more: boolean },
) {
  return {
    data: {
      items,
      total: opts.total,
      per_page: opts.per_page,
      current_page: opts.current_page,
      last_page: Math.ceil(opts.total / opts.per_page),
      has_more: opts.has_more,
    },
  };
}

const PARIS = {
  id: 10,
  name: { en: 'Paris', kr: 'Paris' },
  slug: 'paris',
  region_id: 1,
  status: true,
  link_services: true,
  schema_version: 1,
};

test.describe('/more-dreams — pagination + server-side city filter (SMA-73)', () => {
  test('both grids infinite-scroll independently and show "No more results"', async ({ page }) => {
    await page.route('**/api/reviews/by-entity/**', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: { reviews: [], aggregate: { average_rating: null, review_count: 0 } },
        }),
      });
    });
    await page.route('**/api/cities**', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [PARIS] }),
      });
    });

    await page.route('**/api/activities**', async (route: Route) => {
      const url = new URL(route.request().url());
      const pageParam = Number(url.searchParams.get('page') ?? '1');
      if (pageParam === 1) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(
            envelope([activityFixture(1)], {
              total: 2,
              per_page: 12,
              current_page: 1,
              has_more: true,
            }),
          ),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          envelope([activityFixture(2)], {
            total: 2,
            per_page: 12,
            current_page: 2,
            has_more: false,
          }),
        ),
      });
    });

    await page.route('**/api/restaurants**', async (route: Route) => {
      const url = new URL(route.request().url());
      const pageParam = Number(url.searchParams.get('page') ?? '1');
      if (pageParam === 1) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(
            envelope([restaurantFixture(1)], {
              total: 2,
              per_page: 12,
              current_page: 1,
              has_more: true,
            }),
          ),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          envelope([restaurantFixture(2)], {
            total: 2,
            per_page: 12,
            current_page: 2,
            has_more: false,
          }),
        ),
      });
    });

    await page.goto('/more-dreams');
    await expect(page.getByRole('heading', { name: /Activities & Experiences/i })).toBeVisible();

    // Page 1 of each grid.
    await expect(page.getByText('Activity 1')).toBeVisible();
    await expect(page.getByText('Restaurant 1')).toBeVisible();
    await expect(page.getByText('Activity 2')).toHaveCount(0);

    // Drive each sentinel independently → page 2 appends.
    await page.locator('[data-testid="activities-sentinel"]').scrollIntoViewIfNeeded();
    await expect(page.getByText('Activity 2')).toBeVisible();
    await expect(page.locator('[data-testid="activities-no-more"]')).toBeVisible();

    await page.locator('[data-testid="restaurants-sentinel"]').scrollIntoViewIfNeeded();
    await expect(page.getByText('Restaurant 2')).toBeVisible();
    await expect(page.locator('[data-testid="restaurants-no-more"]')).toBeVisible();
  });

  test('selecting a city sends city_id and resets both grids to page 1', async ({ page }) => {
    const activityCityIds: (string | null)[] = [];

    await page.route('**/api/reviews/by-entity/**', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: { reviews: [], aggregate: { average_rating: null, review_count: 0 } },
        }),
      });
    });
    await page.route('**/api/cities**', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [PARIS] }),
      });
    });

    await page.route('**/api/activities**', async (route: Route) => {
      const url = new URL(route.request().url());
      activityCityIds.push(url.searchParams.get('city_id'));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          envelope([activityFixture(1)], {
            total: 1,
            per_page: 12,
            current_page: 1,
            has_more: false,
          }),
        ),
      });
    });
    await page.route('**/api/restaurants**', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          envelope([restaurantFixture(1)], {
            total: 1,
            per_page: 12,
            current_page: 1,
            has_more: false,
          }),
        ),
      });
    });

    await page.goto('/more-dreams');
    await expect(page.getByText('Activity 1')).toBeVisible();

    // Initial activity fetch carries no city_id.
    expect(activityCityIds[0]).toBeNull();

    // Open the destination dropdown and pick Paris.
    await page.getByText('All destinations').click();
    await page.getByRole('button', { name: 'Paris' }).click();

    // The activities grid re-fetched page 1 with city_id=10.
    await expect.poll(() => activityCityIds.includes('10')).toBe(true);
    await expect(page.getByText(/Showing 1 activities and 1 restaurants in Paris/i)).toBeVisible();
  });
});
