import { test, expect, type Route } from '@playwright/test';

/**
 * E2E for the /signature-journeys top-level tab.
 *
 * SMA-209: the page lists from the dedicated signature_journeys_v2 endpoint
 * (GET /api/signature-journeys) and cards link to the new
 * /signature-journeys/[slug] detail route.
 *
 * SMA-229: the browse-a-city dropdown is replaced by a unified typeahead that
 * matches BOTH city names and journey titles server-side (`?q=`).
 *
 * SMA-247: DESTINATIONS come from the published-journey-derived
 * /api/signature-journeys/destinations endpoint (never the global city
 * catalog), and picking one refetches the grid server-side with `city_id`.
 *
 * Asserts:
 *   - the page renders the 4 known journeys from the new endpoint
 *   - cards link to /signature-journeys/[slug]
 *   - the header uses the overlay (marketing) variant over the hero
 *   - the Signature Journeys nav item is active
 *   - typing a journey title narrows the grid to it
 *   - typing a city name narrows the grid to that city
 *   - a journey-less city is never suggested
 *   - clearing the search restores the full grid
 *   - a city far beyond the first 100 catalog rows is still offered, renders as
 *     the card subtitle, and issues a `city_id` request when picked
 *
 * Strategy: intercept /api/signature-journeys + its /destinations sibling so
 * the test is deterministic against any backend (preview, prod, local). The
 * route handler emulates the backend `q` and `city_id` filters.
 */

const JOURNEYS = [
  { id: 4, slug: 'ritz-carlton-yacht', name: 'The Ritz-Carlton Yacht', city_id: 10 },
  { id: 5, slug: 'four-seasons-yachts', name: 'Four Seasons Yachts', city_id: 10 },
  { id: 6, slug: 'amangati', name: 'Amangati (Aman Cruise)', city_id: 20 },
  {
    id: 7,
    slug: 'fs-private-jet-golf-2026',
    name: '2026 Four Seasons Private Jet Golf Tour',
    city_id: 20,
  },
];

const CITIES = [
  { id: 10, slug: 'monaco', name: { en: 'Monaco', kr: '모나코' }, schema_version: 1 },
  { id: 20, slug: 'maldives', name: { en: 'Maldives', kr: '몰디브' }, schema_version: 1 },
  // No journey references Oslo — it must never be offered as a suggestion.
  { id: 30, slug: 'oslo', name: { en: 'Oslo', kr: '오슬로' }, schema_version: 1 },
];

const CITY_NAME_BY_ID = new Map(CITIES.map((c) => [c.id, c.name.en]));

function journeyFixture(item: { id: number; slug: string; name: string; city_id: number }) {
  return {
    id: item.id,
    slug: item.slug,
    city_id: item.city_id,
    status: 'published',
    title: { en: item.name, kr: item.name },
    cover_image: {
      original: 'https://images.unsplash.com/photo-1505228395891-9a51e7e86bf6?w=600&h=400&fit=crop',
    },
    schema_version: 1,
  };
}

function cityFixture(city: { id: number; slug: string; name: { en: string; kr: string } }) {
  return {
    id: city.id,
    slug: city.slug,
    name: city.name,
    region_id: 1,
    status: true,
    link_services: true,
    schema_version: 1,
  };
}

/**
 * Stub the list endpoint (emulating the backend `q` + `city_id` filters) and
 * its `/destinations` sibling. The list matcher is a RegExp anchored on the
 * end of the path so it can never swallow the `/destinations` request.
 */
async function stubJourneyRoutes(
  page: import('@playwright/test').Page,
  journeys: typeof JOURNEYS,
  destinations: (typeof CITIES)[number][],
  cityNameById: Map<number, string>,
) {
  await page.route(/\/api\/signature-journeys(\?|$)/, async (route: Route) => {
    const params = new URL(route.request().url()).searchParams;
    const q = params.get('q')?.toLowerCase() ?? '';
    const cityId = params.get('city_id');
    let matched = journeys;
    if (q) {
      matched = journeys.filter(
        (j) =>
          j.name.toLowerCase().includes(q) ||
          (cityNameById.get(j.city_id) ?? '').toLowerCase().includes(q),
      );
    } else if (cityId) {
      matched = journeys.filter((j) => j.city_id === Number(cityId));
    }
    const items = matched.map(journeyFixture);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      // v2 list endpoints return the standard pagination envelope.
      body: JSON.stringify({
        data: {
          items,
          total: items.length,
          per_page: 100,
          current_page: 1,
          last_page: 1,
          has_more: false,
        },
      }),
    });
  });

  await page.route(/\/api\/signature-journeys\/destinations/, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: destinations.map(cityFixture) }),
    });
  });
}

test.describe('/signature-journeys', () => {
  test.beforeEach(async ({ page }) => {
    // Oslo has no journey, so the published-journey-derived destinations
    // endpoint never returns it.
    await stubJourneyRoutes(
      page,
      JOURNEYS,
      CITIES.filter((c) => c.slug !== 'oslo'),
      CITY_NAME_BY_ID,
    );
  });

  test('renders the 4 journeys from the new endpoint with the gold signature pill', async ({
    page,
  }) => {
    await page.goto('/signature-journeys');

    await expect(
      page.getByRole('heading', { level: 1, name: /Signature Journeys/i }),
    ).toBeVisible();

    const section = page.locator('[data-testid="section-signature-journeys"]');
    await expect(section).toBeVisible();

    for (const journey of JOURNEYS) {
      await expect(section.getByText(journey.name, { exact: true })).toBeVisible();
    }

    const cards = page.locator('[data-testid="signature-journey-card"]');
    await expect(cards).toHaveCount(4);
    const pill = page.locator('[data-testid="signature-journey-pill"]').first();
    await expect(pill).toHaveClass(/bg-gold/);
    await expect(pill).toHaveText('SIGNATURE JOURNEY');
  });

  test('cards link to the /signature-journeys/[slug] detail route', async ({ page }) => {
    await page.goto('/signature-journeys');

    const cards = page.locator('[data-testid="signature-journey-card"]');
    await expect(cards.first()).toHaveAttribute('href', '/signature-journeys/ritz-carlton-yacht');
  });

  test('uses the overlay header variant and highlights the Signature Journeys nav', async ({
    page,
  }) => {
    await page.goto('/signature-journeys');

    await expect(page.locator('header')).toHaveCount(1);
    const header = page.locator('header').first();
    await expect(header).toBeVisible();
    await expect(header).toHaveClass(/bg-transparent/);
    await expect(header).toHaveClass(/absolute/);

    const navLink = header.getByRole('link', { name: 'SIGNATURE JOURNEYS', exact: true });
    await expect(navLink).toHaveCount(1);
    // Active overlay state: solid white + semibold.
    await expect(navLink).toHaveClass(/font-semibold/);
    await expect(navLink).toHaveClass(/text-white/);
    // No SubNav on a marketing page.
    await expect(page.getByRole('link', { name: 'Upcoming Travels' })).toHaveCount(0);
  });

  test('all 5 top-level nav items render once and in order without overflow', async ({ page }) => {
    await page.goto('/signature-journeys');

    const header = page.locator('header').first();
    for (const label of [
      'DREAM HOTELS',
      'MORE DREAMS',
      'SIGNATURE JOURNEYS',
      'ABOUT',
      'CONCIERGE',
    ]) {
      await expect(header.getByRole('link', { name: label, exact: true })).toHaveCount(1);
    }

    // The nav must not overflow the viewport at a common desktop width.
    const nav = header.locator('nav').first();
    const overflow = await nav.evaluate((el) => el.scrollWidth - el.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('typing a journey title narrows the grid to that journey', async ({ page }) => {
    await page.goto('/signature-journeys');

    const grid = page.locator('[data-testid="section-signature-journeys"]');
    await expect(grid.locator('[data-testid="signature-journey-card"]')).toHaveCount(4);

    await page.getByTestId('signature-journey-search').fill('Amangati');

    await expect(grid.locator('[data-testid="signature-journey-card"]')).toHaveCount(1);
    await expect(grid.getByText('Amangati (Aman Cruise)', { exact: true })).toBeVisible();
  });

  test('typing a city name narrows the grid to that city and suggests the city', async ({
    page,
  }) => {
    await page.goto('/signature-journeys');

    await page.getByTestId('signature-journey-search').fill('Monaco');

    const panel = page.getByTestId('signature-journey-suggestions');
    await expect(panel.getByTestId('suggestion-city')).toHaveText(['Monaco']);

    const grid = page.locator('[data-testid="section-signature-journeys"]');
    await expect(grid.locator('[data-testid="signature-journey-card"]')).toHaveCount(2);
    await expect(grid.getByText('The Ritz-Carlton Yacht', { exact: true })).toBeVisible();
    await expect(grid.getByText('Four Seasons Yachts', { exact: true })).toBeVisible();
    await expect(grid.getByText('Amangati (Aman Cruise)', { exact: true })).toHaveCount(0);

    // Picking the city suggestion keeps the grid on that city.
    await panel.getByTestId('suggestion-city').first().click();
    await expect(grid.locator('[data-testid="signature-journey-card"]')).toHaveCount(2);
    await expect(page.getByText(/Showing 2 signature journeys in Monaco/i)).toBeVisible();
  });

  test('never offers a city that has no journeys', async ({ page }) => {
    await page.goto('/signature-journeys');

    await page.getByTestId('signature-journey-search').click();

    const panel = page.getByTestId('signature-journey-suggestions');
    await expect(panel.getByTestId('suggestion-city')).toHaveText(['Monaco', 'Maldives']);
    await expect(panel.getByText('Oslo', { exact: true })).toHaveCount(0);
  });

  test('an unmatched search shows the empty state and clearing restores the grid', async ({
    page,
  }) => {
    await page.goto('/signature-journeys');

    const search = page.getByTestId('signature-journey-search');
    await search.fill('zzzznothing');

    await expect(page.getByTestId('signature-journeys-empty')).toBeVisible();
    await expect(page.locator('[data-testid="signature-journey-card"]')).toHaveCount(0);

    await page.getByTestId('signature-journey-clear').click();

    const grid = page.locator('[data-testid="section-signature-journeys"]');
    await expect(grid.locator('[data-testid="signature-journey-card"]')).toHaveCount(4);
    await expect(page.getByTestId('signature-journeys-empty')).toHaveCount(0);
  });
});

/**
 * SMA-247 regression: destinations used to be the intersection of the loaded
 * journeys with `getCities()`, which returns only the first 100 rows of an
 * ~84k-row catalog. Ushuaia (id 84231) models a city that could never survive
 * that intersection.
 */
test.describe('/signature-journeys — destinations beyond the city-catalog cap', () => {
  const USHUAIA = {
    id: 84231,
    slug: 'ushuaia',
    name: { en: 'Ushuaia', kr: '우수아이아' },
    schema_version: 1,
  };

  const FAR_JOURNEYS = [
    { id: 4, slug: 'ritz-carlton-yacht', name: 'The Ritz-Carlton Yacht', city_id: 10 },
    { id: 11, slug: 'end-of-the-world', name: 'End of the World', city_id: USHUAIA.id },
  ];

  const FAR_CITIES = [CITIES[0], USHUAIA];
  const FAR_CITY_NAME_BY_ID = new Map(FAR_CITIES.map((c) => [c.id, c.name.en]));

  test.beforeEach(async ({ page }) => {
    await stubJourneyRoutes(page, FAR_JOURNEYS, FAR_CITIES, FAR_CITY_NAME_BY_ID);
  });

  test('offers the far-catalog city, subtitles its card, and refetches by city_id', async ({
    page,
  }) => {
    const cityIdRequests: string[] = [];
    page.on('request', (request) => {
      const cityId = new URL(request.url()).searchParams.get('city_id');
      if (cityId) cityIdRequests.push(cityId);
    });

    await page.goto('/signature-journeys');

    const grid = page.locator('[data-testid="section-signature-journeys"]');
    await expect(grid.locator('[data-testid="signature-journey-card"]')).toHaveCount(2);

    // The card resolves its city name from the destinations endpoint.
    const farCard = grid.locator('[data-testid="signature-journey-card"]', {
      hasText: 'End of the World',
    });
    await expect(farCard.getByText('Ushuaia', { exact: true })).toBeVisible();

    // The city is offered under DESTINATIONS despite its catalog rank.
    await page.getByTestId('signature-journey-search').click();
    const panel = page.getByTestId('signature-journey-suggestions');
    await expect(panel.getByTestId('suggestion-city')).toHaveText(['Monaco', 'Ushuaia']);

    // Picking it narrows the grid via a server-side `city_id` request.
    await panel.getByRole('button', { name: 'Ushuaia', exact: true }).click();

    await expect(grid.locator('[data-testid="signature-journey-card"]')).toHaveCount(1);
    await expect(grid.getByText('End of the World', { exact: true })).toBeVisible();
    expect(cityIdRequests).toEqual([String(USHUAIA.id)]);
  });
});
