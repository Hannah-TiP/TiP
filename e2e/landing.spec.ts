import { test, expect } from '@playwright/test';

test.describe('Landing page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('loads with key navigation links', async ({ page }) => {
    await expect(
      page.getByRole('link', { name: 'DREAM HOTELS', exact: true }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'MORE DREAMS', exact: true }).first(),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'INSIGHTS', exact: true }).first()).toBeVisible();
  });

  test('displays hero section with CTA buttons', async ({ page }) => {
    await expect(page.getByRole('link', { name: /start planning/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /explore hotels/i })).toBeVisible();
  });

  test('displays Les Quatre Cercles', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Les Quatre Cercles' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Carte', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Cercle', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Confidence', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Cénacle', exact: true })).toBeVisible();
  });

  test('does not render the removed subscribe feature', async ({ page }) => {
    // The home contact/subscribe strip used to render a "SUBSCRIBE" button that
    // opened a "Stay Inspired" popup. Both have been removed; if either re-appears
    // anywhere in the DOM, this test must fail.
    await expect(page.getByText('SUBSCRIBE', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Stay Inspired')).toHaveCount(0);
  });
});
