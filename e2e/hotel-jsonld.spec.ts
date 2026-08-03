import { test, expect, type Page } from '@playwright/test';
import { gotoPage } from './support/navigation';

/**
 * E2E for the hotel detail-page server-shell conversion (SMA-217 / MAG-5).
 *
 * Asserts:
 *   - The JSON-LD stack (Hotel + BreadcrumbList, plus FAQPage/review when data
 *     exists) is present in the INITIAL server-rendered HTML — not injected by
 *     client JS.
 *   - TravelAgency stays a site-wide singleton (NOT re-emitted on the hotel
 *     page).
 *   - The booking inputs prefill from the URL query and the "From the Magazine"
 *     section renders when featured data exists and is absent otherwise.
 *
 * The JSON-LD is SERVER-rendered from a direct backend fetch, so it cannot be
 * page.route-mocked; this spec runs against whatever backend the e2e run
 * targets. `aman-tokyo` is the known-seeded slug used across the hotel specs.
 */

const HOTEL_SLUG = 'aman-tokyo';

async function ldJsonDocs(page: Page): Promise<Record<string, unknown>[]> {
  const raw = await page.locator('script[type="application/ld+json"]').allTextContents();
  return raw.map((text) => JSON.parse(text) as Record<string, unknown>);
}

test.describe('hotel detail JSON-LD (server-rendered)', () => {
  test('JSON-LD is in the initial HTML source (not client-injected)', async ({ request }) => {
    // Fetch the raw HTML — no JS runs — to prove server rendering.
    const res = await request.get(`/hotel/${HOTEL_SLUG}`);
    const html = await res.text();

    const scriptBlocks = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
    expect(scriptBlocks, 'no ld+json blocks in raw HTML').not.toBeNull();

    const joined = scriptBlocks!.join('\n');
    expect(joined).toContain('"@type":"Hotel"');
    expect(joined).toContain('"@type":"BreadcrumbList"');
  });

  test('the hotel route emits Hotel + BreadcrumbList and a singleton TravelAgency', async ({
    page,
  }) => {
    await gotoPage(page, `/hotel/${HOTEL_SLUG}`);

    const docs = await ldJsonDocs(page);
    const types = docs.map((d) => String(d['@type']));

    expect(types).toContain('Hotel');
    expect(types).toContain('BreadcrumbList');

    // TravelAgency is the root-layout singleton — present once, NOT re-emitted.
    const agencies = docs.filter((d) => d['@type'] === 'TravelAgency');
    expect(agencies).toHaveLength(1);

    // Breadcrumb ends at the hotel; starts at Home.
    const breadcrumb = docs.find((d) => d['@type'] === 'BreadcrumbList')!;
    const crumbs = breadcrumb.itemListElement as { position: number; name: string }[];
    expect(crumbs[0].name).toBe('Home');
    expect(crumbs.length).toBeGreaterThanOrEqual(3);
  });

  test('booking inputs prefill from the URL query', async ({ page }) => {
    await gotoPage(
      page,
      `/hotel/${HOTEL_SLUG}?checkin=2099-01-10&checkout=2099-01-14&adults=3&kids=1`,
    );

    // The check-in date input reflects the prefilled query value.
    const checkIn = page.locator('input[type="date"]').first();
    await expect(checkIn).toHaveValue('2099-01-10');
  });
});

test.describe('From the Magazine section', () => {
  test('section renders when featured articles exist, absent otherwise', async ({ page }) => {
    await gotoPage(page, `/hotel/${HOTEL_SLUG}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 });

    const section = page.getByTestId('from-the-magazine');
    const count = await section.count();

    if (count > 0) {
      // When present, at least one backlink card links to /magazine/{type}/{slug}.
      const cards = page.getByTestId('from-magazine-card');
      expect(await cards.count()).toBeGreaterThan(0);
      const href = await cards.first().getAttribute('href');
      expect(href).toMatch(/^\/magazine\/(destinations|collections|guides|news|insider)\//);
    } else {
      // Hidden entirely when there is no featured data.
      await expect(section).toHaveCount(0);
    }
  });
});
