import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';

// Stored auth state produced by global-setup (signs in the seeded
// test@test.com user). The SubNav only renders for an *authenticated*
// /my-page/** view — unauthenticated, the page-level guard redirects to
// /sign-in (variant 'none', no header/SubNav) before the client Header
// ever mounts.
const AUTH_STATE_PATH = path.join(__dirname, '.auth', 'user.json');

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
    // Exactly one centralized <header> on the page (no per-page TopBar).
    await expect(page.locator('header')).toHaveCount(1);
    const header = page.locator('header').first();
    await expect(header).toBeVisible();
    // overlay variant: transparent, absolutely positioned over the hero
    await expect(header).toHaveClass(/bg-transparent/);
    await expect(header).toHaveClass(/absolute/);
    // primary nav links present once *in the header* (the Footer also has
    // an "Explore" column with a "Dream Hotels" link, which Playwright's
    // case-insensitive substring name match would otherwise count too —
    // scope to the header to assert the centralized nav, not the footer).
    await expect(header.getByRole('link', { name: 'DREAM HOTELS', exact: true })).toHaveCount(1);
    await expect(header.getByRole('link', { name: 'MORE DREAMS', exact: true })).toHaveCount(1);
    // no SubNav on a marketing page
    await expect(page.getByRole('link', { name: 'Upcoming Travels' })).toHaveCount(0);
  });

  test('app page (/insights) shows the standard light header bar', async ({ page }) => {
    await page.goto('/insights');
    // Exactly one centralized <header> on the page (no per-page TopBar).
    await expect(page.locator('header')).toHaveCount(1);
    const header = page.locator('header').first();
    await expect(header).toBeVisible();
    await expect(header).toHaveClass(/bg-white/);
    await expect(header).not.toHaveClass(/bg-transparent/);
    // Scope to the header: the Footer "Explore" column also has an
    // "Insights" link, so an unscoped substring name match counts 2.
    await expect(header.getByRole('link', { name: 'INSIGHTS', exact: true })).toHaveCount(1);
    await expect(page.getByRole('link', { name: 'Upcoming Travels' })).toHaveCount(0);
  });

  test.describe('authenticated SubNav', () => {
    // The Header is a client component; the SubNav for /my-page/** only
    // appears once it hydrates *and* the session is authenticated (otherwise
    // the page redirects to /sign-in). Run this case with the stored auth
    // state so we land on, and stay on, /my-page/credits.
    test.skip(
      !fs.existsSync(AUTH_STATE_PATH),
      'auth storage state not found (global-setup did not run); skipping authed SubNav check',
    );
    test.use({ storageState: AUTH_STATE_PATH });

    test('my-page subsection renders the SubNav with the active tab', async ({ page }) => {
      await page.goto('/my-page/credits');
      await expect(page).toHaveURL(/\/my-page\/credits/);
      const subnav = page.locator('nav', { hasText: 'Upcoming Travels' }).last();
      await expect(subnav.getByRole('link', { name: 'Credits', exact: true })).toBeVisible();
      await expect(
        subnav.getByRole('link', { name: 'Upcoming Travels', exact: true }),
      ).toBeVisible();
      await expect(subnav.getByRole('link', { name: 'Membership', exact: true })).toBeVisible();
      await expect(subnav.getByRole('link', { name: 'Travel History', exact: true })).toBeVisible();
    });
  });

  test('auth page (/sign-in) renders NO header at all', async ({ page }) => {
    await page.goto('/sign-in');
    await expect(page).toHaveURL(/sign-in/);
    await expect(page.locator('header')).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'DREAM HOTELS' })).toHaveCount(0);
  });
});
