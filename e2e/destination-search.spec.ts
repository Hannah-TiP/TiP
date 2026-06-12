import { test, expect, type Route } from '@playwright/test';

/**
 * SMA-91 — unified destination search.
 *
 * Both the home hero (DestinationDropdown) and Dream Hotels hit the SAME
 * `/api/destinations/search` endpoint, which (backend) returns only bookable
 * destinations ranked by match quality. Here we stub that endpoint to return
 * the real "Paris, France" first (the backend already filtered out the
 * arrondissements / 0-hotel dupes) and assert both surfaces render it at the
 * top, consistently, and forward the typed 3-level suggestion shape.
 *
 * Backend ranking + bookable filtering itself is covered by the tip-backend
 * integration tests; this spec verifies the FE wiring + consistency.
 */

const PARIS_FIRST = [
  {
    id: 100,
    type: 'city',
    name: { en: 'Paris', kr: '파리' },
    slug: 'paris',
    region_name: { en: 'Ile-de-France', kr: '일드프랑스' },
    country_name: { en: 'France', kr: '프랑스' },
  },
  {
    id: 200,
    type: 'country',
    name: { en: 'France', kr: '프랑스' },
    iso_code: 'FR',
  },
];

async function stubDestinationSearch(page: import('@playwright/test').Page) {
  await page.route('**/api/destinations/search**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: PARIS_FIRST }),
    });
  });
  // Keep the hotel grid + aggregates deterministic on Dream Hotels.
  await page.route('**/api/hotels**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          items: [],
          total: 0,
          per_page: 50,
          current_page: 1,
          last_page: 1,
          has_more: false,
        },
      }),
    });
  });
  await page.route('**/api/reviews/aggregates**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: {} }),
    });
  });
}

test.describe('SMA-91 unified destination search', () => {
  test.beforeEach(async ({ page }) => {
    await stubDestinationSearch(page);
  });

  test('Dream Hotels: typing Paris surfaces the real Paris (France) at the top', async ({
    page,
  }) => {
    await page.goto('/dream-hotels');
    await expect(page.getByRole('heading', { name: 'Dream Hotels' })).toBeVisible();

    const destInput = page.getByPlaceholder('Search country, region, or city...');
    await destInput.fill('Paris');

    const panel = page.locator('[data-testid="destination-suggestions"]');
    await expect(panel).toBeVisible();

    // The first suggestion is the real Paris city with its country/region line.
    const firstResult = panel.locator('button').first();
    await expect(firstResult).toContainText('Paris');
    await expect(firstResult).toContainText('France · Ile-de-France');
    await page.screenshot({ path: 'test-results/sma91-dream-hotels-paris.png' });
  });

  test('Home hero: typing Paris surfaces the real Paris (France) at the top', async ({ page }) => {
    await page.goto('/');

    // Open the destination dropdown in the hero search bar (desktop layout).
    await page.getByText('Destination', { exact: true }).first().click();

    const destInput = page.getByPlaceholder('Search destinations...');
    await expect(destInput).toBeVisible();
    await destInput.fill('Paris');

    const parisOption = page.getByRole('button', { name: /Paris/ }).first();
    await expect(parisOption).toBeVisible();
    await expect(parisOption).toContainText('France · Ile-de-France');
    await page.screenshot({ path: 'test-results/sma91-home-paris.png' });
  });

  test('Home hero: shows a popular bookable set before typing', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Destination', { exact: true }).first().click();

    // The empty-state header + the stubbed bookable set render immediately.
    await expect(page.getByText('Popular destinations')).toBeVisible();
    await expect(page.getByRole('button', { name: /Paris/ }).first()).toBeVisible();
    await page.screenshot({ path: 'test-results/sma91-home-popular.png' });
  });

  // Regression guard for the SMA-91 blocker: selecting a CITY must carry a
  // cityId in the concierge prefill, while selecting a COUNTRY (or region) must
  // NOT — a country id passed as cityId poisons destination_city_ids.
  test('Home hero: selecting a CITY carries cityId into the concierge prefill', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByText('Destination', { exact: true }).first().click();

    const destInput = page.getByPlaceholder('Search destinations...');
    await destInput.fill('Paris');
    // Pick the city result (id 100, type city).
    await page.getByRole('button', { name: /Paris/ }).first().click();

    await page
      .getByRole('button', { name: /plan my trip/i })
      .first()
      .click();

    await page.waitForURL('**/concierge?**');
    const url = new URL(page.url());
    expect(url.searchParams.get('destinationType')).toBe('city');
    expect(url.searchParams.get('cityId')).toBe('100');
    expect(url.searchParams.get('city')).toBe('Paris');
  });

  test('Home hero: selecting a COUNTRY does NOT set cityId (no cityId poisoning)', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByText('Destination', { exact: true }).first().click();

    const destInput = page.getByPlaceholder('Search destinations...');
    await destInput.fill('France');
    // Pick the country result (id 200, type country). The Paris city card also
    // mentions "France" in its subtitle, so scope to the option that carries
    // the "Country" type chip and does NOT render "Paris".
    const countryOption = page
      .getByRole('button')
      .filter({ hasText: 'France' })
      .filter({ hasText: 'Country' })
      .filter({ hasNotText: 'Paris' });
    await countryOption.first().click();

    await page
      .getByRole('button', { name: /plan my trip/i })
      .first()
      .click();

    await page.waitForURL('**/concierge?**');
    const url = new URL(page.url());
    expect(url.searchParams.get('destinationType')).toBe('country');
    // The country id (200) must NOT leak in as a cityId.
    expect(url.searchParams.has('cityId')).toBe(false);
    expect(url.searchParams.get('city')).toBe('France');
  });
});
