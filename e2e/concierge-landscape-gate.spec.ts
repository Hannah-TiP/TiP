import { test, expect } from '@playwright/test';

// SMA-231: the concierge 3-panel desktop layout is gated on width >= 1024px AND
// landscape orientation (lg:landscape: Tailwind variants), NOT a bare md: width
// breakpoint. iOS Safari's "aA" text-size zoom widens the CSS layout viewport, so
// a phone can cross 768px and previously fell into the cramped desktop layout.
// Adding the landscape gate keeps any portrait phone on the mobile drawer layout
// regardless of zoom.

const SESSION_UUID = 'sess-uuid-landscape-gate';
const TRIP_ID = 9996;

const baseSession = {
  id: 1,
  user_id: 1,
  trip_id: TRIP_ID,
  status: 'ai',
  session_id: SESSION_UUID,
  schema_version: 1,
  last_message_at: new Date().toISOString(),
};

const baseTrip = {
  id: TRIP_ID,
  status: 'draft',
  current_trip_version_id: 1,
};

const tripVersion = {
  id: 1,
  trip_id: TRIP_ID,
  title: 'Paris Trip',
  start_date: null,
  end_date: null,
  adults: 0,
  kids: 0,
  plan: [] as unknown[],
};

test.describe('Concierge layout gate (width + orientation)', () => {
  test.beforeEach(async ({ context }) => {
    await context.route('**/api/ai-chat/sessions', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [{ session: baseSession, trip: baseTrip }],
        }),
      });
    });

    await context.route(`**/api/trip/${TRIP_ID}*`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { trip: baseTrip, active_quote: null } }),
      });
    });

    await context.route(`**/api/trip/${TRIP_ID}/current-version*`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: tripVersion }),
      });
    });

    await context.route(`**/api/ai-chat/trips/${TRIP_ID}/messages`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
    });
  });

  async function expectMobileLayout(page: import('@playwright/test').Page) {
    await expect(page.getByTestId('mobile-toolbar')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('desktop-conversation-sidebar')).toBeHidden();
    await expect(page.getByTestId('desktop-trip-detail-panel')).toBeHidden();
  }

  async function expectDesktopLayout(page: import('@playwright/test').Page) {
    await expect(page.getByTestId('desktop-conversation-sidebar')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('desktop-trip-detail-panel')).toBeVisible();
    await expect(page.getByTestId('mobile-toolbar')).toBeHidden();
  }

  test('portrait phone 390x844 → mobile layout', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/concierge');
    await expectMobileLayout(page);
  });

  test('portrait phone zoomed-out 820x844 (width > old 768, still portrait) → still mobile', async ({
    page,
  }) => {
    // This is the whole point of SMA-231: crossing the old 768px width in
    // PORTRAIT must NOT trigger the desktop layout.
    await page.setViewportSize({ width: 820, height: 844 });
    await page.goto('/concierge');
    await expectMobileLayout(page);
  });

  test('landscape phone 844x390 (width < 1024) → mobile layout', async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await page.goto('/concierge');
    await expectMobileLayout(page);
  });

  test('iPad landscape 1024x768 → desktop layout', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/concierge');
    await expectDesktopLayout(page);
  });

  test('desktop 1440x900 → desktop layout', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/concierge');
    await expectDesktopLayout(page);
  });
});
