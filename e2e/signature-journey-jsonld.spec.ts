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
 * signature-journey-detail.spec.ts. The detail test discovers a real published
 * slug from the live list endpoint (resilient to seed differences) and skips
 * when the target backend has no published signature journey — the
 * data-dependent assertions can't run without one.
 */

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
    // The site-wide entity is modeled as "Travel in Your Pocket" (TiP), a
    // member agency of Paris Class (its parentOrganization) — MAG-6.
    expect(agencies[0].name).toBe('Travel in Your Pocket');
    expect(agencies[0].alternateName).toBe('TiP');
    expect((agencies[0].parentOrganization as { name?: string })?.name).toBe('Paris Class');
  });

  test('the SJ detail route emits all four JSON-LD types with a singleton TravelAgency', async ({
    page,
  }) => {
    // Discover published journeys from the live list (JSON-LD is server-rendered,
    // so we need a real published slug on the target backend). Skip when the
    // target has none seeded — the data-dependent assertions can't run.
    const listRes = await page.request.get('/api/signature-journeys?per_page=50&language=en');
    const slugs: string[] = listRes.ok()
      ? (((await listRes.json())?.data?.items ?? []) as { slug?: string }[])
          .map((item) => item.slug)
          .filter((slug): slug is string => Boolean(slug))
      : [];
    test.skip(
      slugs.length === 0,
      'no published signature journey on the target backend — nothing to assert',
    );

    let matched = false;

    for (const slug of slugs) {
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
      'published journeys exist but none emitted TouristTrip JSON-LD on the detail route',
    ).toBe(true);
  });
});
