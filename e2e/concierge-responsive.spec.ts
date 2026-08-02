import { test, expect } from '@playwright/test';
import { gotoPage } from './support/navigation';

// Mobile concierge layout (SMA-67). The 3-panel desktop layout collapses to a
// chat-only view at < md, with the conversation sidebar and trip detail panel
// surfaced as slide-over drawers from a mobile toolbar.

const SESSION_UUID = 'sess-uuid-responsive';
const TRIP_ID = 9997;

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

test.use({ viewport: { width: 375, height: 812 } });

test.describe('Concierge responsive layout (375px)', () => {
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

    await context.route(`**/api/trip/${TRIP_ID}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { trip: baseTrip, active_quote: null } }),
      });
    });

    await context.route(`**/api/trip/${TRIP_ID}/current-version`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: tripVersion }),
      });
    });

    await context.route(`**/api/ai-chat/trips/${TRIP_ID}/messages`, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: [] }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            user_message: {
              id: 100,
              content: 'Plan a trip to Paris',
              role: 'user',
              message_type: 'text',
            },
            assistant_message: {
              id: 101,
              content: 'Wonderful — let us begin.',
              role: 'assistant',
              message_type: 'text',
              widgets: [],
            },
            trip: { id: TRIP_ID },
            trip_version: null,
            field_updated: [],
          },
        }),
      });
    });
  });

  test('chat panel is visible and side panels are hidden by default', async ({ page }) => {
    await gotoPage(page, '/concierge');

    // The mobile toolbar drives the chat-only view.
    await expect(page.getByTestId('mobile-toolbar-title')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('mobile-sidebar-toggle')).toBeVisible();
    await expect(page.getByTestId('mobile-trip-panel-toggle')).toBeVisible();

    // Chat input usable one-thumb — the input row wrapper is >= 44px high.
    const input = page.getByPlaceholder(/.+/).first();
    await expect(input).toBeVisible();
    const wrapperHeight = await input.evaluate(
      (el) => el.closest('div')!.getBoundingClientRect().height,
    );
    expect(wrapperHeight).toBeGreaterThanOrEqual(44);

    // Drawers start closed.
    await expect(page.getByTestId('mobile-sidebar-drawer')).toHaveCount(0);
    await expect(page.getByTestId('mobile-trip-panel-drawer')).toHaveCount(0);
  });

  test('the concierge chat container does not overflow horizontally', async ({ page }) => {
    await gotoPage(page, '/concierge');
    await expect(page.getByTestId('mobile-toolbar-title')).toBeVisible({ timeout: 10_000 });

    // NOTE: we scope the no-horizontal-overflow check to the concierge chat
    // region rather than the whole document. On this branch the global
    // <Header> is still the pre-SMA-64 (non-responsive) version and may itself
    // overflow at 375px — that is SMA-64's responsibility (PR #97), not this
    // change. Scoping to the chat input wrapper verifies OUR panels/content do
    // not introduce horizontal overflow, and stays correct once SMA-64 merges.
    const input = page.getByPlaceholder(/.+/).first();
    const handle = await input.evaluateHandle((el) => el.closest('div')!.parentElement!);
    const overflow = await handle.evaluate((el: HTMLElement) => el.scrollWidth - el.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('sidebar drawer opens via toggle and closes via backdrop, X, and Escape', async ({
    page,
  }) => {
    await gotoPage(page, '/concierge');
    await expect(page.getByTestId('mobile-sidebar-toggle')).toBeVisible({ timeout: 10_000 });

    // Open via toggle.
    await page.getByTestId('mobile-sidebar-toggle').click();
    await expect(page.getByTestId('mobile-sidebar-drawer')).toBeVisible();

    // Close via backdrop. The left drawer is 280px wide, so the exposed
    // backdrop sliver is on the right — click there (the default center click
    // would land under the drawer, which sits above the backdrop at z-40).
    await page.getByTestId('mobile-sidebar-backdrop').click({ position: { x: 340, y: 400 } });
    await expect(page.getByTestId('mobile-sidebar-drawer')).toHaveCount(0);

    // Open again, close via X button.
    await page.getByTestId('mobile-sidebar-toggle').click();
    await expect(page.getByTestId('mobile-sidebar-drawer')).toBeVisible();
    await page.getByTestId('mobile-sidebar-close').click();
    await expect(page.getByTestId('mobile-sidebar-drawer')).toHaveCount(0);

    // Open again, close via Escape.
    await page.getByTestId('mobile-sidebar-toggle').click();
    await expect(page.getByTestId('mobile-sidebar-drawer')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('mobile-sidebar-drawer')).toHaveCount(0);
  });

  test('trip detail drawer opens via toggle and closes via backdrop and Escape', async ({
    page,
  }) => {
    await gotoPage(page, '/concierge');
    await expect(page.getByTestId('mobile-trip-panel-toggle')).toBeVisible({ timeout: 10_000 });

    await page.getByTestId('mobile-trip-panel-toggle').click();
    await expect(page.getByTestId('mobile-trip-panel-drawer')).toBeVisible();

    // The right drawer is 85% wide, so the exposed backdrop sliver is on the
    // left — click there (the default center click would land under the drawer,
    // which sits above the backdrop at z-40).
    await page.getByTestId('mobile-trip-panel-backdrop').click({ position: { x: 20, y: 400 } });
    await expect(page.getByTestId('mobile-trip-panel-drawer')).toHaveCount(0);

    await page.getByTestId('mobile-trip-panel-toggle').click();
    await expect(page.getByTestId('mobile-trip-panel-drawer')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('mobile-trip-panel-drawer')).toHaveCount(0);
  });

  test('message input is usable and sends a message', async ({ page }) => {
    await gotoPage(page, '/concierge');
    const input = page.getByPlaceholder(/.+/).first();
    await expect(input).toBeVisible({ timeout: 10_000 });

    await input.fill('Plan a trip to Paris');
    await input.press('Enter');

    await expect(page.getByText('Plan a trip to Paris')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Wonderful — let us begin.')).toBeVisible({ timeout: 10_000 });
  });
});
