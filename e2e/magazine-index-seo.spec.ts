import { test, expect } from '@playwright/test';
import { gotoPage } from './support/navigation';

/**
 * E2E for MAG-6 (SMA-218): sitemap.xml, llms.txt, robots.txt, the /magazine
 * index filter UI, and the site-wide TravelAgency JSON-LD singleton.
 *
 * The dynamic sitemap / llms.txt entries + the filtered list require a live
 * backend with published fixtures, so those structural checks self-skip when no
 * seed data is reachable. The always-on assertions (routes serve, entity block
 * present, exactly one TravelAgency block, filter tabs render) run in CI.
 */

const SEEDED_HOTEL_SLUG = process.env.E2E_HOTEL_SLUG || '';
const SEEDED_ARTICLE_PATH = process.env.E2E_MAGAZINE_ARTICLE_PATH || '';

test.describe('sitemap.xml', () => {
  test('serves an XML sitemap containing the static magazine root', async ({ page }) => {
    const response = await gotoPage(page, '/sitemap.xml');
    expect(response?.status()).toBe(200);
    const body = await response!.text();
    expect(body).toContain('<urlset');
    expect(body).toContain('/magazine');
  });

  test('contains a seeded hotel + article URL when fixtures exist', async ({ page }) => {
    test.skip(
      !SEEDED_HOTEL_SLUG || !SEEDED_ARTICLE_PATH,
      'Set E2E_HOTEL_SLUG + E2E_MAGAZINE_ARTICLE_PATH to run',
    );
    const response = await gotoPage(page, '/sitemap.xml');
    const body = await response!.text();
    expect(body).toContain(`/hotel/${SEEDED_HOTEL_SLUG}`);
    expect(body).toContain(SEEDED_ARTICLE_PATH);
  });
});

test.describe('llms.txt', () => {
  test('serves a text/plain entity block', async ({ page }) => {
    const response = await gotoPage(page, '/llms.txt');
    expect(response?.status()).toBe(200);
    expect(response?.headers()['content-type']).toContain('text/plain');
    const body = await response!.text();
    expect(body).toContain('# Travel in Your Pocket (TiP)');
    expect(body).toContain('Paris Class');
    expect(body).toContain('17335835');
  });
});

test.describe('robots.txt', () => {
  test('serves a robots file that references the sitemap and disallows /my-page', async ({
    page,
  }) => {
    const response = await gotoPage(page, '/robots.txt');
    expect(response?.status()).toBe(200);
    const body = await response!.text();
    expect(body).toContain('Sitemap:');
    expect(body).toContain('/sitemap.xml');
    expect(body).toContain('/my-page');
  });
});

test.describe('/magazine index', () => {
  test('renders the type tabs and a TravelAgency JSON-LD singleton', async ({ page }) => {
    await gotoPage(page, '/magazine');
    // SSR + client hydration can momentarily double-render the tab row (one copy
    // hidden mid-reconcile), so scope to the visible instance to avoid a
    // transient strict-mode violation during the hydration window.
    await expect(page.getByTestId('magazine-type-tab-all').filter({ visible: true })).toBeVisible();
    await expect(
      page.getByTestId('magazine-type-tab-destinations').filter({ visible: true }),
    ).toBeVisible();

    // The site-wide TravelAgency block is emitted exactly ONCE (root layout).
    const html = await page.content();
    const matches = html.match(/"@type":"TravelAgency"/g) ?? [];
    expect(matches.length).toBe(1);
  });

  test('narrows the list when a type tab is selected (URL syncs)', async ({ page }) => {
    await gotoPage(page, '/magazine');
    // Click the visible tab (see hydration-window note above).
    await page.getByTestId('magazine-type-tab-destinations').filter({ visible: true }).click();
    await expect(page).toHaveURL(/type=destinations/);
  });
});
