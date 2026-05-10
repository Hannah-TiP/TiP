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
});
