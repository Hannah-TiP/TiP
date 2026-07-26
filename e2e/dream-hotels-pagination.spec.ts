import { test, expect, type Route } from '@playwright/test';

/**
 * /dream-hotels — server-side pagination + infinite scroll (SMA-73).
 *
 *   - Infinite scroll is always active (per_page=50), whether or not the map is
 *     rendered: page 1 is fetched on mount; scrolling the sentinel into view
 *     loads page 2 and appends. When the last page returns has_more=false, the
 *     "No more results" footer shows.
 *   - Map-VISIBLE mode (search active): same normal pagination — the map renders
 *     the loaded hotels and the infinite-scroll sentinel/footer stay active.
 *     There is NO special single fetch and NO cap banner.
 *
 * Strategy: stub /api/hotels and inspect the `page`/`per_page` query params to
 * serve the right page, so the test is deterministic without a backend.
 */

function hotelFixture(id: number) {
  return {
    id,
    slug: `hotel-${id}`,
    status: 'published',
    star_rating: '5-star',
    name: { en: `Stub Hotel ${id}`, kr: `Stub Hotel ${id}` },
    address: { en: 'Somewhere', kr: 'Somewhere' },
    geo: { lat: 48.8 + id * 0.001, lng: 2.3 + id * 0.001 },
    images: [
      {
        original:
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop',
      },
    ],
    schema_version: 1,
  };
}

function envelope(
  items: ReturnType<typeof hotelFixture>[],
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

test.describe('/dream-hotels — pagination + infinite scroll (SMA-73)', () => {
  test('map-hidden: infinite scroll appends page 2, then shows "No more results"', async ({
    page,
  }) => {
    await page.route('**/api/reviews/aggregates**', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: {} }),
      });
    });

    await page.route('**/api/hotels**', async (route: Route) => {
      const url = new URL(route.request().url());
      const pageParam = Number(url.searchParams.get('page') ?? '1');
      const perPage = Number(url.searchParams.get('per_page') ?? '50');
      // Guard against a future regression past the backend cap of 50.
      expect(perPage).toBeLessThanOrEqual(50);
      // Two pages: page 1 (50 hotels, has_more), page 2 (1 hotel, end).
      if (pageParam === 1) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(
            envelope(
              Array.from({ length: 50 }, (_, i) => hotelFixture(i + 1)),
              { total: 51, per_page: perPage, current_page: 1, has_more: true },
            ),
          ),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          envelope([hotelFixture(51)], {
            total: 51,
            per_page: perPage,
            current_page: 2,
            has_more: false,
          }),
        ),
      });
    });

    await page.goto('/dream-hotels');
    await expect(page.getByRole('heading', { name: 'Dream Hotels' })).toBeVisible();

    // Page 1 rendered, map hidden.
    await expect(page.getByText('Stub Hotel 1', { exact: true })).toBeVisible();
    await expect(page.locator('[data-testid="hotel-map"]')).toHaveCount(0);
    // Page-2-only hotel not yet present.
    await expect(page.getByText('Stub Hotel 51', { exact: true })).toHaveCount(0);

    // Scroll the sentinel into view → page 2 loads and appends.
    await page.locator('[data-testid="infinite-sentinel"]').scrollIntoViewIfNeeded();

    await expect(page.getByText('Stub Hotel 51', { exact: true })).toBeVisible();
    await expect(page.locator('[data-testid="no-more-results"]')).toBeVisible();
  });

  test('map-visible: normal pagination, map renders loaded hotels, infinite scroll stays active, no banner', async ({
    page,
  }) => {
    let perPageSeen: number | null = null;
    let hotelCallCount = 0;

    await page.route('**/api/reviews/aggregates**', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: {} }),
      });
    });
    await page.route('**/api/destinations/search**', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      });
    });

    await page.route('**/api/hotels**', async (route: Route) => {
      const url = new URL(route.request().url());
      hotelCallCount += 1;
      perPageSeen = Number(url.searchParams.get('per_page') ?? '50');
      // The map-visible fetch must use the same capped pagination — never a
      // single over-cap one-shot.
      expect(perPageSeen).toBeLessThanOrEqual(50);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          envelope([hotelFixture(1)], {
            total: 1,
            per_page: perPageSeen,
            current_page: 1,
            has_more: false,
          }),
        ),
      });
    });

    await page.goto('/dream-hotels');
    await expect(page.getByRole('heading', { name: 'Dream Hotels' })).toBeVisible();

    // Type a hotel-name search → map becomes visible; pagination is unchanged.
    // The page renders a single name-search input, but it can briefly
    // double-match during hydration; target the first to avoid a strict-mode flake.
    await page.getByPlaceholder('Search hotels by name...').first().fill('Ritz');

    await expect(page.locator('[data-testid="hotel-map"]')).toBeVisible();
    // The removed cap banner must never render.
    await expect(page.locator('[data-testid="map-cap-banner"]')).toHaveCount(0);
    // Infinite-scroll affordances stay active while the map is visible.
    await expect(page.locator('[data-testid="infinite-sentinel"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="no-more-results"]')).toBeVisible();

    expect(perPageSeen).toBe(50);
    expect(hotelCallCount).toBeGreaterThan(0);
  });
});
