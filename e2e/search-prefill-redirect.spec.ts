import { test, expect } from '@playwright/test';

/**
 * E2E: Unauthenticated SearchBar click → /sign-in with prefill URL.
 *
 * This file runs under the default `chromium` project (no stored
 * storageState) so visiting /concierge bounces to /sign-in with the
 * `redirect` query param carrying the full prefill URL.
 */

test.describe('SearchBar → unauthed redirect preserves prefill params', () => {
  test.beforeEach(async ({ context }) => {
    // Cities list for the DestinationDropdown — single city so the click
    // is deterministic.
    await context.route('**/api/cities**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: 7,
              region_id: 1,
              slug: 'paris',
              status: true,
              name: { en: 'Paris', kr: '파리' },
              link_services: true,
              schema_version: 1,
            },
          ],
        }),
      });
    });
  });

  test('clicking Search unauthed lands on /sign-in?redirect=/concierge?prefill=1...', async ({
    page,
  }) => {
    await page.goto('/');

    await page.getByText('DESTINATION', { exact: true }).click();
    await page.getByText('Paris').click();
    await page.getByRole('button', { name: /plan my trip/i }).click();

    await page.waitForURL(/\/sign-in/, { timeout: 15_000 });

    const url = new URL(page.url());
    const redirect = url.searchParams.get('redirect');
    expect(redirect).toBeTruthy();
    expect(redirect!).toContain('/concierge');
    expect(redirect!).toContain('prefill=1');
    expect(redirect!).toContain('cityId=7');
    expect(redirect!).toContain('city=Paris');
  });
});
