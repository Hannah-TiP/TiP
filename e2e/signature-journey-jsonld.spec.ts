import { test, expect, type Page } from '@playwright/test';

/**
 * E2E for the SJ detail-page structured data (SMA-210 / SJ-5).
 *
 * Asserts:
 *   - TravelAgency (Paris Class) is a site-wide singleton — emitted exactly
 *     once in the root layout, present on every route.
 *   - On the SJ detail route the four JSON-LD types are present:
 *     TravelAgency (from the layout) + TouristTrip + BreadcrumbList + FAQPage,
 *     and TravelAgency is still a singleton.
 *
 * The JSON-LD is SERVER-rendered from a direct backend fetch (not the browser
 * /api proxy), so it cannot be page.route-mocked; this spec runs against
 * whatever backend the e2e run targets (local / preview / prod), mirroring
 * signature-journey-detail.spec.ts. A candidate list of known published slugs
 * is tried so the test is resilient to seed differences.
 */

const CANDIDATE_SLUGS = [
  'ritz-carlton-yacht',
  'four-seasons-yachts',
  'amangati',
  'fs-private-jet-golf-2026',
];

async function ldJsonDocs(page: Page): Promise<Record<string, unknown>[]> {
  const raw = await page.locator('script[type="application/ld+json"]').allTextContents();
  return raw.map((text) => JSON.parse(text) as Record<string, unknown>);
}

function typesOf(docs: Record<string, unknown>[]): string[] {
  return docs.map((d) => String(d['@type']));
}

test.describe('signature-journey JSON-LD', () => {
  test('TravelAgency is a site-wide singleton on a static route', async ({ page }) => {
    await page.goto('/signature-journeys');

    const docs = await ldJsonDocs(page);
    const agencies = docs.filter((d) => d['@type'] === 'TravelAgency');
    expect(agencies).toHaveLength(1);
    expect(agencies[0].name).toBe('Paris Class');
    expect(agencies[0].url).toBe('https://parisclass.com');
  });

  test('the SJ detail route emits all four JSON-LD types with a singleton TravelAgency', async ({
    page,
  }) => {
    let matched = false;

    for (const slug of CANDIDATE_SLUGS) {
      const response = await page.goto(`/signature-journeys/${slug}`);
      // If routing failed entirely, try the next candidate.
      if (!response) continue;

      const docs = await ldJsonDocs(page);
      const types = typesOf(docs);

      // A published journey renders TouristTrip; skip candidates that don't
      // resolve to a journey (only the layout's TravelAgency present).
      if (!types.includes('TouristTrip')) continue;

      matched = true;

      // All four types present.
      expect(types).toContain('TravelAgency');
      expect(types).toContain('TouristTrip');
      expect(types).toContain('BreadcrumbList');
      expect(types).toContain('FAQPage');

      // TravelAgency stays a singleton on the detail page.
      expect(docs.filter((d) => d['@type'] === 'TravelAgency')).toHaveLength(1);

      // Breadcrumb hierarchy: Home → Signature Journeys → journey.
      const breadcrumb = docs.find((d) => d['@type'] === 'BreadcrumbList')!;
      const crumbs = breadcrumb.itemListElement as { position: number }[];
      expect(crumbs).toHaveLength(3);

      break;
    }

    expect(
      matched,
      'no candidate slug resolved to a published signature journey on the target backend',
    ).toBe(true);
  });
});
