import { test, expect } from '@playwright/test';

/**
 * E2E for /magazine/[type]/[slug] (SMA-220).
 *
 * The page is a SERVER component: `generateMetadata` + the JSON-LD stack are
 * rendered from a fetch issued by the Next server (NOT the browser), so
 * Playwright's `page.route` can't mock the data path. These specs therefore
 * cover the request-shape guarantees that DON'T need a live backend (an unknown
 * plural segment 404s deterministically), plus a backend-gated assertion that
 * a published article server-renders the three ld+json blocks in the initial
 * HTML (View-Source visible). The backend-gated block self-skips when no
 * published fixture is reachable, so the deterministic 404 assertions always
 * run in CI while the full structural check runs post-deploy against real data.
 */

const PUBLISHED_TYPE_SEGMENT = process.env.E2E_MAGAZINE_TYPE || 'destinations';
const PUBLISHED_SLUG = process.env.E2E_MAGAZINE_SLUG || '';

test.describe('/magazine/[type]/[slug]', () => {
  test('an unknown plural type segment renders a 404', async ({ page }) => {
    const response = await page.goto('/magazine/hotels/anything');
    expect(response?.status()).toBe(404);
  });

  test('the singular type value is not a valid URL segment (404)', async ({ page }) => {
    // The consumer URL uses plurals; the singular enum must NOT resolve.
    const response = await page.goto('/magazine/destination/best-hotels-in-japan');
    expect(response?.status()).toBe(404);
  });

  test('an unknown slug under a valid type renders a 404', async ({ page }) => {
    const response = await page.goto(
      `/magazine/${PUBLISHED_TYPE_SEGMENT}/__definitely-not-a-real-slug__`,
    );
    expect(response?.status()).toBe(404);
  });

  test('a published article server-renders the 3 JSON-LD blocks in the initial HTML', async ({
    page,
  }) => {
    test.skip(!PUBLISHED_SLUG, 'Set E2E_MAGAZINE_SLUG to a published article to run this check');

    const response = await page.goto(`/magazine/${PUBLISHED_TYPE_SEGMENT}/${PUBLISHED_SLUG}`);
    expect(response?.status()).toBe(200);

    // Assert on the raw HTML the SERVER sent (View-Source), not the hydrated DOM,
    // to prove the JSON-LD is server-rendered rather than injected by CSR.
    const html = await response!.text();
    const scripts = html.match(/<script type="application\/ld\+json">/g) ?? [];
    expect(scripts.length).toBeGreaterThanOrEqual(3);

    const types = [...html.matchAll(/"@type":"(Article|FAQPage|BreadcrumbList)"/g)].map(
      (m) => m[1],
    );
    expect(types).toContain('Article');
    expect(types).toContain('FAQPage');
    expect(types).toContain('BreadcrumbList');

    // The H1 hero title is present.
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('[data-testid="magazine-hero"]')).toBeVisible();
  });
});
