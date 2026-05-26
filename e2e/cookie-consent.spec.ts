import { test, expect } from '@playwright/test';

test.describe('Cookie consent banner', () => {
  test.beforeEach(async ({ page }) => {
    // Clear consent storage before each test so banner is shown fresh.
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('tip-cookie-consent'));
  });

  test('banner appears on first visit and disappears after accepting', async ({ page }) => {
    await page.goto('/');

    const banner = page.getByTestId('cookie-consent-banner');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('We value your privacy');

    // Click Accept All
    await page.getByTestId('cookie-accept-all').click();
    await expect(banner).not.toBeVisible();
  });

  test('banner does not reappear after accepting and reloading', async ({ page }) => {
    await page.goto('/');

    await page.getByTestId('cookie-accept-all').click();
    await expect(page.getByTestId('cookie-consent-banner')).not.toBeVisible();

    // Reload the page
    await page.reload();

    // Banner should stay hidden (consent stored in localStorage)
    await expect(page.getByTestId('cookie-consent-banner')).not.toBeVisible();
  });

  test('Manage Preferences opens the modal with category toggles', async ({ page }) => {
    await page.goto('/');

    const banner = page.getByTestId('cookie-consent-banner');
    await expect(banner).toBeVisible();

    // Click Manage Preferences
    await banner.getByText('Manage Preferences').click();

    const modal = page.getByTestId('cookie-preferences-modal');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('Necessary');
    await expect(modal).toContainText('Analytics');
    await expect(modal).toContainText('Marketing');
    await expect(modal).toContainText('Always active');
  });

  test('saving custom preferences hides banner and persists', async ({ page }) => {
    await page.goto('/');

    // Open preferences
    await page.getByText('Manage Preferences').click();

    // Toggle analytics on
    await page.getByTestId('cookie-toggle-analytics').click();

    // Save
    await page.getByTestId('cookie-save-preferences').click();

    // Banner and modal should be gone
    await expect(page.getByTestId('cookie-consent-banner')).not.toBeVisible();
    await expect(page.getByTestId('cookie-preferences-modal')).not.toBeVisible();

    // Verify localStorage was set with analytics=true, marketing=false
    const stored = await page.evaluate(() => {
      const raw = localStorage.getItem('tip-cookie-consent');
      return raw ? JSON.parse(raw) : null;
    });
    expect(stored).not.toBeNull();
    expect(stored.analytics).toBe(true);
    expect(stored.marketing).toBe(false);
  });
});

test.describe('Legal pages', () => {
  test('privacy policy page renders content', async ({ page }) => {
    await page.goto('/privacy-policy');
    await expect(page).toHaveURL(/privacy-policy/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Privacy Policy');
    await expect(page.getByText('Information We Collect')).toBeVisible();
    await expect(page.getByText('Cookies and Tracking Technologies')).toBeVisible();
  });

  test('terms of service page renders content', async ({ page }) => {
    await page.goto('/terms-of-service');
    await expect(page).toHaveURL(/terms-of-service/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Terms of Service');
    await expect(page.getByText('Eligibility')).toBeVisible();
    await expect(page.getByText('Bookings and Payments')).toBeVisible();
  });
});

test.describe('Footer links', () => {
  test('Privacy Policy link navigates to /privacy-policy', async ({ page }) => {
    await page.goto('/about');

    // Scroll to footer and click
    const footer = page.locator('footer');
    await footer.scrollIntoViewIfNeeded();
    await footer.getByText('Privacy Policy').click();

    await expect(page).toHaveURL(/privacy-policy/);
  });

  test('Terms of Service link navigates to /terms-of-service', async ({ page }) => {
    await page.goto('/about');

    const footer = page.locator('footer');
    await footer.scrollIntoViewIfNeeded();
    await footer.getByText('Terms of Service').click();

    await expect(page).toHaveURL(/terms-of-service/);
  });

  test('Cookie Settings link opens the preferences modal', async ({ page }) => {
    // First accept cookies so the banner is hidden
    await page.goto('/about');
    await page.evaluate(() => {
      localStorage.setItem(
        'tip-cookie-consent',
        JSON.stringify({ analytics: true, marketing: true, timestamp: '2026-01-01T00:00:00Z' }),
      );
    });
    await page.reload();

    // Banner should not be visible
    await expect(page.getByTestId('cookie-consent-banner')).not.toBeVisible();

    // Click Cookie Settings in footer
    const footer = page.locator('footer');
    await footer.scrollIntoViewIfNeeded();
    await footer.getByText('Cookie Settings').click();

    // Modal should appear
    await expect(page.getByTestId('cookie-preferences-modal')).toBeVisible();
  });
});
