import { test, expect, type Route } from '@playwright/test';

/**
 * E2E for the /signature-journeys top-level tab.
 *
 * SMA-209: the page now lists from the dedicated signature_journeys_v2
 * endpoint (GET /api/signature-journeys) and cards link to the new
 * /signature-journeys/[slug] detail route.
 *
 * Asserts:
 *   - the page renders the 4 known journeys from the new endpoint
 *   - cards link to /signature-journeys/[slug]
 *   - the header uses the overlay (marketing) variant over the hero
 *   - the Signature Journeys nav item is active
 *   - the destination filter narrows the grid
 *
 * Strategy: intercept /api/signature-journeys + /api/cities so the test is
 * deterministic against any backend (preview, prod, local).
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
];

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

test.describe('/signature-journeys', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/signature-journeys**', async (route: Route) => {
      const items = JOURNEYS.map(journeyFixture);
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

    await page.route('**/api/cities**', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: CITIES }),
      });
    });
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

  test('the destination filter narrows the grid', async ({ page }) => {
    await page.goto('/signature-journeys');

    await expect(page.getByText('The Ritz-Carlton Yacht', { exact: true })).toBeVisible();
    await expect(page.getByText('Amangati (Aman Cruise)', { exact: true })).toBeVisible();

    // Open the destination dropdown and choose Monaco (city_id 10).
    await page.getByText('All destinations').first().click();
    await page.getByRole('button', { name: 'Monaco', exact: true }).click();

    // Monaco journeys stay; Maldives-only journeys drop out.
    await expect(page.getByText('The Ritz-Carlton Yacht', { exact: true })).toBeVisible();
    await expect(page.getByText('Four Seasons Yachts', { exact: true })).toBeVisible();
    await expect(page.getByText('Amangati (Aman Cruise)', { exact: true })).toHaveCount(0);
    await expect(
      page.getByText('2026 Four Seasons Private Jet Golf Tour', { exact: true }),
    ).toHaveCount(0);
    await expect(page.getByText(/Showing 2 signature journeys in Monaco/i)).toBeVisible();
  });
});
