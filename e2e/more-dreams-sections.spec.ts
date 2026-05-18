import { test, expect, type Route } from '@playwright/test';

/**
 * Smoke-tests the /more-dreams sections split.
 *
 * Strategy: intercept the /api/activities call and respond with fixture data
 * keyed by ?kind=. This keeps the test deterministic against any backend
 * (preview, prod, local) and lets us assert the 4 known signature-journey
 * packages render only under the Signature Journeys section.
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
    images: [{ original: 'https://placehold.co/600x400' }],
    schema_version: 1,
  };
}

test.describe('/more-dreams sections split', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/activities**', async (route: Route) => {
      const url = new URL(route.request().url());
      const kind = url.searchParams.get('kind');
      if (kind === 'package') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: PACKAGES.map((p) => activityFixture(p, 'package')),
          }),
        });
        return;
      }
      if (kind === 'local_experience') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: LOCAL_EXPERIENCES.map((p) => activityFixture(p, 'local_experience')),
          }),
        });
        return;
      }
      // Fallback — should not be hit if the page filters by kind correctly.
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      });
    });

    // Restaurants + cities still proxy through to backend, but stub them too
    // so the test doesn't depend on backend reachability.
    await page.route('**/api/restaurants**', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      });
    });

    await page.route('**/api/cities**', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      });
    });
  });

  test('renders both activity-section headlines with at least one card each', async ({ page }) => {
    await page.goto('/more-dreams');

    // Heading 2: Activities & Experiences
    await expect(
      page.getByRole('heading', { level: 2, name: /Activities & Experiences/i }),
    ).toBeVisible();

    // Heading 2: Signature Journeys
    await expect(
      page.getByRole('heading', { level: 2, name: /^Signature Journeys$/i }),
    ).toBeVisible();

    // At least one card per section (via testid set on ActivityCard)
    const standardCards = page.locator('[data-testid="activity-card-standard"]');
    await expect(standardCards.first()).toBeVisible();
    expect(await standardCards.count()).toBeGreaterThan(0);

    const signatureCards = page.locator('[data-testid="activity-card-signature"]');
    await expect(signatureCards.first()).toBeVisible();
    expect(await signatureCards.count()).toBeGreaterThan(0);
  });

  test('the 4 known packages appear under Signature Journeys and NOT under Activities & Experiences', async ({
    page,
  }) => {
    await page.goto('/more-dreams');

    // Sections scoped by data-testid.
    const activitiesSection = page.locator('[data-testid="section-activities-experiences"]');
    const signatureSection = page.locator('[data-testid="section-signature-journeys"]');

    await expect(activitiesSection).toBeVisible();
    await expect(signatureSection).toBeVisible();

    for (const pkg of PACKAGES) {
      // Each package is rendered inside the Signature Journeys section.
      await expect(signatureSection.getByText(pkg.name, { exact: true })).toBeVisible();
      // And NOT inside the Activities & Experiences section.
      await expect(activitiesSection.getByText(pkg.name, { exact: true })).toHaveCount(0);
    }
  });

  test('signature journey cards use the gold accent pill', async ({ page }) => {
    await page.goto('/more-dreams');

    await page.waitForSelector('[data-testid="activity-pill-signature"]');
    const pill = page.locator('[data-testid="activity-pill-signature"]').first();
    await expect(pill).toBeVisible();
    // The card pill carries `bg-gold` (Tailwind utility for #C4956A).
    await expect(pill).toHaveClass(/bg-gold/);
    await expect(pill).toHaveText('SIGNATURE JOURNEY');
  });
});
