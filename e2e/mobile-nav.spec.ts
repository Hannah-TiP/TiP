import { test, expect } from '@playwright/test';

// Mobile navigation drawer behaviour at a phone viewport. The /about page is a
// public app-variant page that always renders the centralized header, so it is
// a stable target that needs no auth or backend mocking.
test.describe('Mobile navigation drawer', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('hamburger is visible and desktop nav links are hidden at 375px', async ({ page }) => {
    await page.goto('/about');

    const hamburger = page.getByRole('button', { name: /open menu/i });
    await expect(hamburger).toBeVisible();

    // The desktop nav links container is display:none at < md, so the link is
    // present in the DOM but not visible.
    await expect(
      page.locator('header').getByRole('link', { name: 'DREAM HOTELS', exact: true }),
    ).toBeHidden();
  });

  test('tapping the hamburger opens the drawer with all nav links', async ({ page }) => {
    await page.goto('/about');

    const drawer = page.getByTestId('mobile-nav-drawer');
    // Closed: slid off-screen to the right.
    await expect(drawer).toHaveClass(/translate-x-full/);

    await page.getByRole('button', { name: /open menu/i }).click();

    await expect(drawer).toHaveClass(/translate-x-0/);
    for (const label of [
      'DREAM HOTELS',
      'MORE DREAMS',
      'SIGNATURE JOURNEYS',
      'CONCIERGE',
      'MAGAZINE',
      'ABOUT',
    ]) {
      await expect(drawer.getByRole('link', { name: label, exact: true })).toBeVisible();
    }
    // Unauthenticated: shows SIGN IN, not MY PAGE / LOGOUT.
    await expect(drawer.getByRole('link', { name: 'SIGN IN', exact: true })).toBeVisible();
  });

  test('drawer closes on the X button', async ({ page }) => {
    await page.goto('/about');
    const drawer = page.getByTestId('mobile-nav-drawer');

    await page.getByRole('button', { name: /open menu/i }).click();
    await expect(drawer).toHaveClass(/translate-x-0/);

    await page.getByRole('button', { name: /close menu/i }).click();
    await expect(drawer).toHaveClass(/translate-x-full/);
  });

  test('drawer closes on backdrop tap', async ({ page }) => {
    await page.goto('/about');
    const drawer = page.getByTestId('mobile-nav-drawer');

    await page.getByRole('button', { name: /open menu/i }).click();
    await expect(drawer).toHaveClass(/translate-x-0/);

    await page.getByTestId('mobile-nav-backdrop').click();
    await expect(drawer).toHaveClass(/translate-x-full/);
  });

  test('drawer closes on Escape', async ({ page }) => {
    await page.goto('/about');
    const drawer = page.getByTestId('mobile-nav-drawer');

    await page.getByRole('button', { name: /open menu/i }).click();
    await expect(drawer).toHaveClass(/translate-x-0/);

    await page.keyboard.press('Escape');
    await expect(drawer).toHaveClass(/translate-x-full/);
  });

  test('tapping a nav link navigates and closes the drawer', async ({ page }) => {
    await page.goto('/about');
    const drawer = page.getByTestId('mobile-nav-drawer');

    await page.getByRole('button', { name: /open menu/i }).click();
    await drawer.getByRole('link', { name: 'DREAM HOTELS', exact: true }).click();

    await expect(page).toHaveURL(/dream-hotels/);
    await expect(drawer).toHaveClass(/translate-x-full/);
  });

  test('no horizontal page scroll when the drawer is closed', async ({ page }) => {
    await page.goto('/about');
    const overflow = await page.evaluate(() => {
      const el = document.documentElement;
      return { scrollWidth: el.scrollWidth, clientWidth: el.clientWidth };
    });
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
  });
});
