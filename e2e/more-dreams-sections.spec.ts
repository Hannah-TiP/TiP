import { test, expect, type Route } from '@playwright/test';

/**
 * Smoke-tests the /more-dreams page after Signature Journeys was promoted to
 * its own top-level /signature-journeys tab (task RfR_dnQU).
 *
 * More Dreams must now show ONLY:
 *   - Activities & Experiences (kind=local_experience)
 *   - Curated Restaurants
 * and must NOT render a Signature Journeys section nor request kind=package.
 *
 * Strategy: intercept /api/activities and respond by ?kind=. If the page ever
 * regresses and requests kind=package, we fail it explicitly.
 *
 * The 4 known packages (kind=package in production):
 *   - The Ritz-Carlton Yacht
 *   - Four Seasons Yachts
 *   - Amangati (Aman Cruise)
 *   - 2026 Four Seasons Private Jet Golf Tour
 */

const PACKAGES = [
  { id: 4, slug: 'ritz-carlton-yacht', name: 'The Ritz-Carlton Yacht' },
  { id: 5, slug: 'four-seasons-yachts', name: 'Four Seasons Yachts' },
  { id: 6, slug: 'amangati', name: 'Amangati (Aman Cruise)' },
  {
    id: 7,
    slug: 'fs-private-jet-golf-2026',
    name: '2026 Four Seasons Private Jet Golf Tour',
  },
];

const LOCAL_EXPERIENCES = [
  { id: 101, slug: 'paris-private-boat', name: 'Paris Private Boat Tour' },
  { id: 102, slug: 'kyoto-tea-ceremony', name: 'Kyoto Tea Ceremony' },
];

function activityFixture(item: { id: number; slug: string; name: string }, kind: string) {
  return {
    id: item.id,
    slug: item.slug,
    kind,
    status: 'published',
    name: { en: item.name, kr: item.name },
    images: [
      {
        original:
          'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop',
      },
    ],
    schema_version: 1,
  };
}

// The v2 list endpoints return the standard pagination envelope (SMA-73).
function envelope<T>(items: T[]) {
  return {
    data: {
      items,
      total: items.length,
      per_page: 12,
      current_page: 1,
      last_page: 1,
      has_more: false,
    },
  };
}

test.describe('/more-dreams — Activities + Restaurants only (no Signature Journeys)', () => {
  let packageRequested = false;

  test.beforeEach(async ({ page }) => {
    packageRequested = false;
    await page.route('**/api/activities**', async (route: Route) => {
      const url = new URL(route.request().url());
      const kind = url.searchParams.get('kind');
      if (kind === 'package') {
        // If More Dreams ever requests packages again this flag fails the test.
        packageRequested = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(envelope(PACKAGES.map((p) => activityFixture(p, 'package')))),
        });
        return;
      }
      if (kind === 'local_experience') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(
            envelope(LOCAL_EXPERIENCES.map((p) => activityFixture(p, 'local_experience'))),
          ),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(envelope([])),
      });
    });

    await page.route('**/api/restaurants**', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(envelope([])),
      });
    });

    // Destinations come from the published-experience endpoint (SMA-247);
    // these tests never open the dropdown, so an empty list is enough — it just
    // must not leak an unstubbed request to the real backend.
    await page.route('**/api/destinations/experiences**', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      });
    });
  });

  test('renders Activities & Experiences but NOT a Signature Journeys section', async ({
    page,
  }) => {
    await page.goto('/more-dreams');

    await expect(
      page.getByRole('heading', { level: 2, name: /Activities & Experiences/i }),
    ).toBeVisible();

    const standardCards = page.locator('[data-testid="activity-card-standard"]');
    await expect(standardCards.first()).toBeVisible();
    expect(await standardCards.count()).toBeGreaterThan(0);

    // No Signature Journeys section or heading. (The old ActivityCard
    // 'signature' variant testids were removed with the variant in SMA-209.)
    await expect(page.locator('[data-testid="section-signature-journeys"]')).toHaveCount(0);
    await expect(
      page.getByRole('heading', { level: 2, name: /^Signature Journeys$/i }),
    ).toHaveCount(0);

    // And the page never asked the API for kind=package.
    expect(packageRequested).toBe(false);
  });

  test('none of the 4 known packages appear anywhere on More Dreams', async ({ page }) => {
    await page.goto('/more-dreams');

    await expect(
      page.getByRole('heading', { level: 2, name: /Activities & Experiences/i }),
    ).toBeVisible();

    for (const pkg of PACKAGES) {
      await expect(page.getByText(pkg.name, { exact: true })).toHaveCount(0);
    }
  });
});
