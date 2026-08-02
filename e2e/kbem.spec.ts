import { test, expect } from '@playwright/test';
import { gotoPage } from './support/navigation';

/**
 * E2E: /kbem KB금융그룹 employee-benefits landing page.
 *
 * Runs under the default `chromium` project (no stored auth storageState),
 * so it verifies the page is reachable by an anonymous visitor. Asserts the
 * hero + a downstream section render, and that the two key CTAs point at
 * /register and /dream-hotels via their data-testid hooks (not brittle text).
 */

test.describe('KB employee landing page', () => {
  test('loads for an anonymous visitor with key sections + CTAs', async ({ page }) => {
    await gotoPage(page, '/kbem');

    // Hero H1 renders.
    await expect(page.getByRole('heading', { level: 1 })).toContainText('럭셔리 여행');

    // A downstream section heading renders.
    await expect(page.getByRole('heading', { level: 2, name: /멤버십 혜택/ })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: /파트너/ })).toBeVisible();

    // Hero CTA → /register.
    await expect(page.getByTestId('kbem-hero-cta')).toHaveAttribute('href', '/register');

    // Hotels CTA → /dream-hotels.
    await expect(page.getByTestId('kbem-hotels-cta')).toHaveAttribute('href', '/dream-hotels');

    // CTA banner → /register.
    await expect(page.getByTestId('kbem-cta-banner')).toHaveAttribute('href', '/register');

    // Global footer business-registration text is present (mockup footer dropped).
    await expect(page.getByText('887-86-03126')).toBeVisible();
  });
});
