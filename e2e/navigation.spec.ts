import { test, expect } from '@playwright/test';

test.describe('Page navigation', () => {
  test('dream-hotels page loads', async ({ page }) => {
    await page.goto('/dream-hotels');
    await expect(page).toHaveURL(/dream-hotels/);
  });

  test('sign-in page loads', async ({ page }) => {
    await page.goto('/sign-in');
    await expect(page).toHaveURL(/sign-in/);
  });

  test('register page loads', async ({ page }) => {
    await page.goto('/register');
    await expect(page).toHaveURL(/register/);
  });

  test('insights page loads', async ({ page }) => {
    await page.goto('/insights');
    await expect(page).toHaveURL(/insights/);
  });
});

test.describe('Centralized header — variants & active state', () => {
  test('marketing page (/dream-hotels) shows the overlay header over the hero', async ({
    page,
  }) => {
    await page.goto('/dream-hotels');
    const header = page.locator('header').first();
    await expect(header).toBeVisible();
    // overlay variant: transparent, absolutely positioned over the hero
    await expect(header).toHaveClass(/bg-transparent/);
    await expect(header).toHaveClass(/absolute/);
    // primary nav links present once
    await expect(page.getByRole('link', { name: 'DREAM HOTELS' })).toHaveCount(1);
    await expect(page.getByRole('link', { name: 'MORE DREAMS' })).toHaveCount(1);
    // no SubNav on a marketing page
    await expect(page.getByRole('link', { name: 'Upcoming Travels' })).toHaveCount(0);
  });

  test('app page (/insights) shows the standard light header bar', async ({ page }) => {
    await page.goto('/insights');
    const header = page.locator('header').first();
    await expect(header).toBeVisible();
    await expect(header).toHaveClass(/bg-white/);
    await expect(header).not.toHaveClass(/bg-transparent/);
    await expect(page.getByRole('link', { name: 'INSIGHTS' })).toHaveCount(1);
    await expect(page.getByRole('link', { name: 'Upcoming Travels' })).toHaveCount(0);
  });

  test('my-page subsection renders the SubNav with the active tab', async ({ page }) => {
    // The layout Header renders the SubNav for /my-page/** before the
    // page-level auth redirect fires, so the SubNav is present in the
    // initial document.
    await page.goto('/my-page/credits', { waitUntil: 'commit' });
    const subnav = page.locator('nav', { hasText: 'Travel History' }).first();
    await expect(subnav.getByRole('link', { name: 'Credits' })).toBeVisible();
    await expect(subnav.getByRole('link', { name: 'Upcoming Travels' })).toBeVisible();
    await expect(subnav.getByRole('link', { name: 'Membership' })).toBeVisible();
  });

  test('auth page (/sign-in) renders NO header at all', async ({ page }) => {
    await page.goto('/sign-in');
    await expect(page).toHaveURL(/sign-in/);
    await expect(page.locator('header')).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'DREAM HOTELS' })).toHaveCount(0);
  });
});
