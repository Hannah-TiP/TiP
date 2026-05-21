import { test, expect } from '@playwright/test';

/**
 * E2E: /about page renders and the auth-aware CTA points the right way.
 *
 * Runs under the default `chromium` project (no stored storageState), so
 * useSession() is unauthenticated and the CTA must point at /register.
 * The authenticated branch (-> /concierge) is exercised by hand or by an
 * authed-project spec when one is added.
 */

test.describe('About page', () => {
  test('renders the hero + closing CTA pointing to /register (logged out)', async ({ page }) => {
    await page.goto('/about');

    // Hero is visible.
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Thoughtfully Redefined');

    // Stats are present (exact match — the figures also appear in prose).
    await expect(page.getByText('2,200+', { exact: true })).toBeVisible();
    await expect(page.getByText('24/7', { exact: true })).toBeVisible();

    // Both CTAs (hero + closing) carry the auth-aware href for visitors.
    const ctas = page.getByTestId('about-primary-cta');
    await expect(ctas).toHaveCount(2);
    for (const href of await ctas.evaluateAll((els) =>
      els.map((e) => (e as HTMLAnchorElement).getAttribute('href')),
    )) {
      expect(href).toBe('/register');
    }
  });

  test('FAQ accordion opens and closes one item at a time', async ({ page }) => {
    await page.goto('/about');

    const faq = page.getByTestId('about-faq');
    const questions = faq.getByRole('button');

    // First item starts open (selected default — matches the visual mock).
    await expect(questions.nth(0)).toHaveAttribute('aria-expanded', 'true');
    await expect(questions.nth(1)).toHaveAttribute('aria-expanded', 'false');

    // Opening a second item closes the first (single-open accordion).
    await questions.nth(1).click();
    await expect(questions.nth(0)).toHaveAttribute('aria-expanded', 'false');
    await expect(questions.nth(1)).toHaveAttribute('aria-expanded', 'true');

    // Clicking the open item closes it (no item open).
    await questions.nth(1).click();
    await expect(questions.nth(1)).toHaveAttribute('aria-expanded', 'false');
  });

  test('footer "About Us" link routes to /about', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'About Us' }).click();
    await expect(page).toHaveURL('/about');
  });
});
