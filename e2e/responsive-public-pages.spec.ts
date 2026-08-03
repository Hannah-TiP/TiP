import { test, expect, type Page, type Route } from '@playwright/test';
import { gotoPage } from './support/navigation';

/**
 * SMA-65 — responsive public pages at a 375px phone viewport.
 *
 * Asserts the landing page and the four other changed public pages render with
 * NO horizontal page scroll at 375px, and that the SearchBar collapses to a
 * single CTA that opens a full-screen overlay on mobile.
 *
 * Strategy: the four data-driven pages (dream-hotels, more-dreams,
 * signature-journeys) fetch lists on mount; stub every list endpoint with an
 * empty paginated envelope so the test exercises the page CHROME (hero,
 * filters, grid container, footer) deterministically without a live backend.
 * The no-scroll guarantee is a property of the layout, not the data.
 */

const PHONE = { width: 375, height: 812 };

function emptyEnvelope() {
  return {
    data: {
      items: [],
      total: 0,
      per_page: 50,
      current_page: 1,
      last_page: 1,
      has_more: false,
    },
  };
}

async function stubLists(page: Page) {
  const empty = async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(emptyEnvelope()),
    });
  };
  await page.route('**/api/hotels**', empty);
  await page.route('**/api/activities**', empty);
  await page.route('**/api/restaurants**', empty);
  // Anchored on the end of the path so the journey LIST matcher can never
  // swallow its /destinations sibling (a paginated envelope there would make
  // the page render `cities.map` over an object and blank the hero).
  await page.route(/\/api\/signature-journeys(\?|$)/, empty);

  // Seed one city so the Destination pickers have content to render at width;
  // the off-screen regression was about positioning, not data. Both published-
  // destination endpoints (SMA-247) return a BARE City[] under `data` — never a
  // paginated { items } envelope. The pages map over it directly, so an
  // envelope here throws during render, and the fallback-less <Suspense> on
  // more-dreams/signature-journeys swallows that, blanking the hero.
  const destinations = async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [
          {
            id: 7,
            slug: 'paris',
            name: { en: 'Paris', kr: '파리' },
            region_id: 1,
            status: true,
            link_services: true,
            schema_version: 1,
          },
        ],
      }),
    });
  };
  await page.route(/\/api\/signature-journeys\/destinations/, destinations);
  await page.route(/\/api\/destinations\/experiences/, destinations);
  await page.route('**/api/reviews/aggregates**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: {} }),
    });
  });
}

async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => {
    const el = document.documentElement;
    return { scrollWidth: el.scrollWidth, clientWidth: el.clientWidth };
  });
  // Allow a 1px rounding slack (sub-pixel layout).
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
}

test.describe('Responsive public pages (375px)', () => {
  test.use({ viewport: PHONE });

  test.beforeEach(async ({ page }) => {
    await stubLists(page);
  });

  test('landing page has no horizontal scroll', async ({ page }) => {
    await gotoPage(page, '/');
    await expect(
      page.getByRole('heading', { name: 'Dream Hotels, Thoughtfully Curated.' }),
    ).toBeVisible();
    await expectNoHorizontalScroll(page);
  });

  test('dream-hotels has no horizontal scroll', async ({ page }) => {
    await gotoPage(page, '/dream-hotels');
    await expect(page.getByRole('heading', { name: 'Dream Hotels' })).toBeVisible();
    await expectNoHorizontalScroll(page);
  });

  test('more-dreams has no horizontal scroll', async ({ page }) => {
    await gotoPage(page, '/more-dreams');
    // This page wraps its hero in a top-level <Suspense> (it reads
    // useSearchParams), so the hero <section>/heading is painted only after
    // client hydration — later than the default 5s assertion window under
    // waitUntil:'load'. Wait for the network to settle so hydration has run.
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'More Dreams' })).toBeVisible({
      timeout: 15000,
    });
    await expectNoHorizontalScroll(page);
  });

  test('signature-journeys has no horizontal scroll', async ({ page }) => {
    await gotoPage(page, '/signature-journeys');
    // Same Suspense-gated hydration as more-dreams: wait for the network to
    // settle before asserting the hero region is present.
    await page.waitForLoadState('networkidle');
    // The hero title is i18n-driven; just wait for the hero region.
    await expect(page.locator('section').first()).toBeVisible({ timeout: 15000 });
    await expectNoHorizontalScroll(page);
  });
});

test.describe('SearchBar mobile collapse (375px)', () => {
  test.use({ viewport: PHONE });

  test.beforeEach(async ({ page }) => {
    await stubLists(page);
  });

  test('collapses to a single CTA that opens and closes a full-screen overlay', async ({
    page,
  }) => {
    await gotoPage(page, '/');

    const cta = page.getByTestId('searchbar-mobile-cta');
    await expect(cta).toBeVisible();

    // The overlay is not in the DOM until the CTA is tapped.
    await expect(page.getByTestId('searchbar-overlay')).toHaveCount(0);

    await cta.click();
    const overlay = page.getByTestId('searchbar-overlay');
    await expect(overlay).toBeVisible();

    // Opening the overlay must not introduce horizontal scroll.
    await expectNoHorizontalScroll(page);

    // Regression guard for the vertical-collapse blocker: the overlay must
    // fill the viewport. A previous build pinned it to a ~56px strip via an
    // unresolved `inset-0` stretch, pushing all 5 fields + Submit below the
    // fold (y ≈ 857–1276px). The horizontal-only check above missed it because
    // Playwright auto-scrolls before clicking. Assert the container height and
    // that the first field + Submit are inside the initial viewport WITHOUT
    // scrolling.
    const innerHeight = await page.evaluate(() => window.innerHeight);

    const overlayBox = await overlay.boundingBox();
    expect(overlayBox).not.toBeNull();
    expect(overlayBox!.height).toBeGreaterThanOrEqual(innerHeight - 5);

    // The first field (Destination) must be visible in the initial viewport.
    const firstField = overlay.getByText('Destination', { exact: true }).first();
    const firstFieldBox = await firstField.boundingBox();
    expect(firstFieldBox).not.toBeNull();
    expect(firstFieldBox!.y).toBeGreaterThanOrEqual(0);
    expect(firstFieldBox!.y).toBeLessThanOrEqual(innerHeight);

    // The Submit button (pinned footer) must also sit within the viewport.
    const submit = overlay.getByRole('button', { name: /plan my trip/i }).last();
    const submitBox = await submit.boundingBox();
    expect(submitBox).not.toBeNull();
    expect(submitBox!.y).toBeGreaterThanOrEqual(0);
    expect(submitBox!.y).toBeLessThanOrEqual(innerHeight);

    await page.getByTestId('searchbar-overlay-close').click();
    await expect(page.getByTestId('searchbar-overlay')).toHaveCount(0);
  });

  // Regression guard: opening Dates / Guests / Trip Type inside the overlay
  // must keep each picker fully on-screen at 375px. Previously these dropdowns
  // kept their desktop `left-[360px]`/`left-[560px]`/fixed-700px positioning
  // and rendered off-screen, overflowing the page.
  for (const field of [
    { label: 'Check-in', marker: 'Clear dates' }, // DatePicker
    { label: 'Guests', marker: 'Adults' }, // GuestsDropdown
    { label: 'Trip Type', marker: 'Bleisure' }, // TripTypeDropdown
  ]) {
    test(`opening the ${field.label} picker in the overlay stays within the 375px viewport`, async ({
      page,
    }) => {
      await gotoPage(page, '/');

      await page.getByTestId('searchbar-mobile-cta').click();
      const overlay = page.getByTestId('searchbar-overlay');
      await expect(overlay).toBeVisible();

      // Open the field inside the overlay.
      await overlay.getByText(field.label, { exact: true }).first().click();

      // Confirm the picker actually opened by waiting for its unique content.
      const marker = overlay.getByText(field.marker, { exact: true }).first();
      await expect(marker).toBeVisible();

      // No horizontal page scroll introduced by the open picker.
      await expectNoHorizontalScroll(page);

      // The open picker's box must be within the viewport (no off-screen / no
      // horizontal overflow). Find the picker as the nearest positioned
      // dropdown ancestor of the marker.
      const box = await marker.evaluate((el) => {
        const panel = (el.closest('.absolute') as HTMLElement) ?? el;
        const r = panel.getBoundingClientRect();
        return { left: r.left, right: r.right };
      });
      expect(box.left).toBeGreaterThanOrEqual(-1);
      expect(box.right).toBeLessThanOrEqual(375 + 1);
    });
  }
});
