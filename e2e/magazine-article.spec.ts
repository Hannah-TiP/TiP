import { test, expect } from '@playwright/test';
import { gotoPage } from './support/navigation';

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
    const response = await gotoPage(page, '/magazine/hotels/anything');
    expect(response?.status()).toBe(404);
  });

  test('the singular type value is not a valid URL segment (404)', async ({ page }) => {
    // The consumer URL uses plurals; the singular enum must NOT resolve.
    const response = await gotoPage(page, '/magazine/destination/best-hotels-in-japan');
    expect(response?.status()).toBe(404);
  });

  test('an unknown slug under a valid type renders a 404', async ({ page }) => {
    const response = await gotoPage(
      page,
      `/magazine/${PUBLISHED_TYPE_SEGMENT}/__definitely-not-a-real-slug__`,
    );
    expect(response?.status()).toBe(404);
  });

  test('a published article server-renders the 3 JSON-LD blocks in the initial HTML', async ({
    page,
  }) => {
    test.skip(!PUBLISHED_SLUG, 'Set E2E_MAGAZINE_SLUG to a published article to run this check');

    const response = await gotoPage(page, `/magazine/${PUBLISHED_TYPE_SEGMENT}/${PUBLISHED_SLUG}`);
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

  test('a destination article with ranked hotels server-renders 4 JSON-LD blocks incl. ItemList, DOM order matching', async ({
    page,
  }) => {
    test.skip(
      !PUBLISHED_SLUG,
      'Set E2E_MAGAZINE_SLUG to a published DESTINATION article with ranked hotels to run this check',
    );

    const response = await gotoPage(page, `/magazine/${PUBLISHED_TYPE_SEGMENT}/${PUBLISHED_SLUG}`);
    expect(response?.status()).toBe(200);

    const html = await response!.text();
    // Skip when the fixture has no ranked hotels (ItemList is conditional).
    test.skip(
      !/"@type":"ItemList"/.test(html),
      'Fixture has no ranked hotels — set E2E_MAGAZINE_SLUG to a destination with ranked hotels',
    );

    // 4 server-rendered ld+json blocks: Article, FAQPage, BreadcrumbList, ItemList.
    const scripts = html.match(/<script type="application\/ld\+json">/g) ?? [];
    expect(scripts.length).toBeGreaterThanOrEqual(4);
    const types = [...html.matchAll(/"@type":"(Article|FAQPage|BreadcrumbList|ItemList)"/g)].map(
      (m) => m[1],
    );
    expect(types).toContain('Article');
    expect(types).toContain('FAQPage');
    expect(types).toContain('BreadcrumbList');
    expect(types).toContain('ItemList');

    // The ItemList hotel-slug order (parsed from the ld+json URLs) must equal the
    // on-screen ranked-section CTA order (both derive from the same payload).
    const itemListMatch = html.match(/"@type":"ItemList","itemListElement":(\[[\s\S]*?\])\}/);
    expect(itemListMatch).not.toBeNull();
    const itemListSlugs = [...itemListMatch![1].matchAll(/\/hotel\/([a-z0-9-]+)"/g)].map(
      (m) => m[1],
    );

    const ctaHrefs = await page
      .locator('[data-testid="magazine-ranked"] [data-testid="magazine-hotel-cta"]')
      .evaluateAll((els) => els.map((el) => (el as HTMLAnchorElement).getAttribute('href') ?? ''));
    const domSlugs = ctaHrefs.map((href) => href.replace('/hotel/', ''));

    expect(domSlugs.length).toBeGreaterThan(0);
    expect(domSlugs).toEqual(itemListSlugs);
  });
});

/**
 * MAG-4 per-type JSON-LD sets (SMA-216). Each is env-gated on a seeded published
 * slug of that type so the deterministic checks above always run in CI, while
 * these full structural checks run post-deploy against real data.
 */
async function ldTypesInInitialHtml(html: string): Promise<string[]> {
  return [...html.matchAll(/"@type":"([A-Za-z]+)"/g)].map((m) => m[1]);
}

test.describe('/magazine/[type]/[slug] — MAG-4 type sets', () => {
  test('a Guide article server-renders Article + HowTo + FAQPage + BreadcrumbList', async ({
    page,
  }) => {
    const slug = process.env.E2E_MAGAZINE_GUIDE_SLUG || '';
    test.skip(!slug, 'Set E2E_MAGAZINE_GUIDE_SLUG to a published guide with steps');

    const response = await gotoPage(page, `/magazine/guides/${slug}`);
    expect(response?.status()).toBe(200);
    const html = await response!.text();
    const types = await ldTypesInInitialHtml(html);
    expect(types).toContain('Article');
    expect(types).toContain('HowTo');
    expect(types).toContain('BreadcrumbList');
    await expect(page.locator('[data-testid="magazine-guide-steps"]')).toBeVisible();
  });

  test('a News article server-renders NewsArticle (not Article) + BreadcrumbList', async ({
    page,
  }) => {
    const slug = process.env.E2E_MAGAZINE_NEWS_SLUG || '';
    test.skip(!slug, 'Set E2E_MAGAZINE_NEWS_SLUG to a published news article');

    const response = await gotoPage(page, `/magazine/news/${slug}`);
    expect(response?.status()).toBe(200);
    const html = await response!.text();
    const types = await ldTypesInInitialHtml(html);
    expect(types).toContain('NewsArticle');
    expect(types).not.toContain('Article'); // NewsArticle replaces Article
    expect(types).toContain('BreadcrumbList');
    await expect(page.locator('[data-testid="magazine-news-dateline"]')).toBeVisible();
  });

  test('an Insider article server-renders a plain Article with NO author node', async ({
    page,
  }) => {
    const slug = process.env.E2E_MAGAZINE_INSIDER_SLUG || '';
    test.skip(!slug, 'Set E2E_MAGAZINE_INSIDER_SLUG to a published insider article');

    const response = await gotoPage(page, `/magazine/insider/${slug}`);
    expect(response?.status()).toBe(200);
    const html = await response!.text();
    const types = await ldTypesInInitialHtml(html);
    expect(types).toContain('Article');
    // No E-E-A-T author node (Insider bylines are descoped).
    expect(html).not.toContain('"@type":"Person"');
  });
});

/**
 * SMA-266 — cta body-block button + footer-CTA suppression.
 *
 * The article data is fetched by the Next SERVER (not the browser), so
 * `page.route` mocks can't reach it — these checks are env-gated on seeded
 * published fixtures, matching the pattern of the JSON-LD specs above.
 * Deterministic coverage of the same behavior lives in the Vitest suite
 * `src/__tests__/components/magazine/MagazineArticleContent.test.tsx`.
 *
 * Fixture contract:
 * - E2E_MAGAZINE_CTA_SLUG: a published article (type segment via
 *   E2E_MAGAZINE_CTA_TYPE, default `destinations`) containing a `cta` body
 *   block with `button_url` (E2E_MAGAZINE_CTA_HREF) and a KR `button_label`
 *   (E2E_MAGAZINE_CTA_LABEL_KR).
 * - E2E_MAGAZINE_SLUG (reused from above): a published article with NO
 *   authored cta button — exercises the legacy footer CTA path.
 */
test.describe('/magazine/[type]/[slug] — cta block button (SMA-266)', () => {
  const CTA_TYPE_SEGMENT = process.env.E2E_MAGAZINE_CTA_TYPE || 'destinations';
  const CTA_SLUG = process.env.E2E_MAGAZINE_CTA_SLUG || '';
  const CTA_HREF = process.env.E2E_MAGAZINE_CTA_HREF || '';
  const CTA_LABEL_KR = process.env.E2E_MAGAZINE_CTA_LABEL_KR || '';

  test('an authored cta button renders the KR label + authored href in KR mode, suppressing the footer CTA', async ({
    page,
  }) => {
    test.skip(
      !CTA_SLUG,
      'Set E2E_MAGAZINE_CTA_SLUG to a published article whose cta block has button fields',
    );

    // KR mode: the content island reads the saved preference from localStorage.
    await page.addInitScript(() => {
      window.localStorage.setItem('tip-lang', 'kr');
    });
    const response = await gotoPage(page, `/magazine/${CTA_TYPE_SEGMENT}/${CTA_SLUG}`);
    expect(response?.status()).toBe(200);

    const button = page.getByTestId('magazine-cta-button');
    await expect(button).toBeVisible();
    if (CTA_HREF) {
      await expect(button).toHaveAttribute('href', CTA_HREF);
    }
    if (CTA_LABEL_KR) {
      await expect(button).toHaveText(CTA_LABEL_KR);
    }

    // External URLs must open in a new tab with noopener; internal ones must not.
    const href = (await button.getAttribute('href')) ?? '';
    if (href.startsWith('/')) {
      await expect(button).not.toHaveAttribute('target', '_blank');
    } else {
      await expect(button).toHaveAttribute('target', '_blank');
      expect((await button.getAttribute('rel')) ?? '').toContain('noopener');
    }

    // Q2 option (b): the hardcoded footer Concierge CTA is suppressed.
    await expect(page.getByTestId('magazine-footer-cta')).toHaveCount(0);
  });

  test('an article without an authored cta button keeps the legacy footer CTA and shows no in-body button', async ({
    page,
  }) => {
    test.skip(!PUBLISHED_SLUG, 'Set E2E_MAGAZINE_SLUG to a published article WITHOUT a cta button');

    const response = await gotoPage(page, `/magazine/${PUBLISHED_TYPE_SEGMENT}/${PUBLISHED_SLUG}`);
    expect(response?.status()).toBe(200);

    const footer = page.getByTestId('magazine-footer-cta');
    await expect(footer).toBeVisible();
    await expect(footer.locator('a')).toHaveAttribute('href', '/concierge');
    await expect(page.getByTestId('magazine-cta-button')).toHaveCount(0);
  });
});
