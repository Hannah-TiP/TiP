import { test, expect, type Route } from '@playwright/test';
import { gotoPage } from './support/navigation';

/**
 * /dream-hotels — the HotelMap is gated (SMA-72). It must only render once the
 * user has expressed a location/name signal:
 *   - a non-empty hotel-name search, OR
 *   - a selected destination (country / region / city).
 * Star-rating alone does NOT show the map. The map is conditionally MOUNTED
 * (not CSS-hidden) so Google Maps never initializes for users who never see it.
 *
 * Strategy: stub the page's API routes so the page renders deterministically
 * without a backend or Google Maps key. We assert on the `data-testid`
 * wrappers the page renders around the map and its loading slot.
 */

const HOTELS = [
  {
    id: 1,
    slug: 'the-ritz-paris',
    status: 'published',
    star_rating: '5-star',
    name: { en: 'The Ritz Paris', kr: 'The Ritz Paris' },
    address: { en: '15 Place Vendôme, Paris', kr: '15 Place Vendôme, Paris' },
    geo: { lat: 48.8682, lng: 2.3285 },
    images: [
      {
        original:
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop',
      },
    ],
    schema_version: 1,
  },
];

const DESTINATIONS = [
  {
    id: 7,
    type: 'city',
    name: { en: 'Paris', kr: 'Paris' },
    country_name: { en: 'France', kr: 'France' },
  },
];

async function stubRoutes(
  routeFn: (pattern: string, handler: (r: Route) => Promise<void>) => void,
) {
  routeFn('**/api/hotels**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          items: HOTELS,
          total: HOTELS.length,
          per_page: 50,
          current_page: 1,
          last_page: 1,
          has_more: false,
        },
      }),
    });
  });

  routeFn('**/api/destinations/search**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: DESTINATIONS }),
    });
  });

  routeFn('**/api/reviews/aggregates**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: {} }),
    });
  });
}

test.describe('/dream-hotels — map gating (SMA-72)', () => {
  test.beforeEach(async ({ page }) => {
    await stubRoutes((pattern, handler) => page.route(pattern, handler));
  });

  test('map is absent on load, appears on search, disappears when cleared', async ({ page }) => {
    await gotoPage(page, '/dream-hotels');

    // The hero copy and grid render regardless.
    await expect(page.getByRole('heading', { name: 'Dream Hotels' })).toBeVisible();

    // State 1: no filters → no map element in the DOM.
    await expect(page.locator('[data-testid="hotel-map"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="map-loading"]')).toHaveCount(0);
    await page.screenshot({ path: 'test-results/dream-hotels-map-gating-1-no-map.png' });

    // State 2: type a hotel-name search → map appears.
    const searchInput = page.getByPlaceholder('Search hotels by name...');
    await searchInput.fill('Ritz');
    await expect(page.locator('[data-testid="hotel-map"]')).toBeVisible();
    await page.screenshot({ path: 'test-results/dream-hotels-map-gating-2-search-map.png' });

    // State 3: clear the search → map disappears.
    await searchInput.fill('');
    await expect(page.locator('[data-testid="hotel-map"]')).toHaveCount(0);
  });

  test('selecting a destination shows the map; clearing it hides the map again', async ({
    page,
  }) => {
    await gotoPage(page, '/dream-hotels');
    await expect(page.getByRole('heading', { name: 'Dream Hotels' })).toBeVisible();
    await expect(page.locator('[data-testid="hotel-map"]')).toHaveCount(0);

    // State 4: pick a destination → map appears.
    const destInput = page.getByPlaceholder('Search country, region, or city...');
    await destInput.fill('Paris');
    const suggestion = page.getByRole('button', { name: /Paris/i }).first();
    await suggestion.click();
    await expect(page.locator('[data-testid="hotel-map"]')).toBeVisible();
    await page.screenshot({ path: 'test-results/dream-hotels-map-gating-3-destination-map.png' });

    // State 5: clear the destination → map disappears.
    await page.locator('[data-testid="clear-destination"]').click();
    await expect(page.locator('[data-testid="hotel-map"]')).toHaveCount(0);
  });

  test('star-rating filter alone does NOT show the map', async ({ page }) => {
    await gotoPage(page, '/dream-hotels');
    await expect(page.getByRole('heading', { name: 'Dream Hotels' })).toBeVisible();
    await expect(page.locator('[data-testid="hotel-map"]')).toHaveCount(0);

    // Open the HOTEL TYPE dropdown and pick 5 Star.
    await page.getByRole('button', { name: /All types/i }).click();
    await page.getByRole('button', { name: '5 Star', exact: true }).click();

    // Map still must NOT render — star rating isn't a "where" signal.
    await expect(page.locator('[data-testid="hotel-map"]')).toHaveCount(0);
  });
});
