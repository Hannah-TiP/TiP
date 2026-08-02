import { test, expect } from '@playwright/test';
import { gotoPage } from './support/navigation';

/**
 * E2E: Unauthenticated SearchBar click → /sign-in with prefill URL.
 *
 * This file runs under the default `chromium` project (no stored
 * storageState) so visiting /concierge bounces to /sign-in with the
 * `redirect` query param carrying the full prefill URL.
 */

test.describe('SearchBar → unauthed redirect preserves prefill params', () => {
  test.beforeEach(async ({ context }) => {
    // Destination suggestions for the DestinationDropdown. Since SMA-91 the
    // dropdown hits the unified, bookable-only `/api/destinations/search`
    // (not `/api/cities`); a blank query returns the "popular" set, so this
    // single Paris city renders as soon as the dropdown opens. `id: 7` +
    // `type: 'city'` make the resulting prefill carry `cityId=7&city=Paris`.
    await context.route('**/api/destinations/search**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: 7,
              type: 'city',
              name: { en: 'Paris', kr: '파리' },
              slug: 'paris',
              region_name: { en: 'Ile-de-France', kr: '일드프랑스' },
              country_name: { en: 'France', kr: '프랑스' },
            },
          ],
        }),
      });
    });
  });

  test('clicking Search unauthed lands on /sign-in?redirect=/concierge?prefill=1...', async ({
    page,
  }) => {
    await gotoPage(page, '/');

    // Label renders as "DESTINATION" via CSS `uppercase`, but the DOM text
    // node is "Destination" (i18n value); match the actual text content.
    await page.getByText('Destination', { exact: true }).click();
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
