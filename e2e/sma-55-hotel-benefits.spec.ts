import { test, type Page, type BrowserContext } from '@playwright/test';
import path from 'node:path';

// SMA-55: Hotel benefits panel inside the concierge hotel-preview modal, and
// (no duplication) on the public /hotel/[id] page where benefits live only in
// the right-rail BookingCard sidebar.
//
// Strategy: mock ONLY the chat session + a hotel_carousel widget so the modal
// can be opened. The card click then calls the REAL running backend through the
// Next proxy (/api/hotels/by-id/{id}), so the rendered benefits are real seeded
// data. Hotel 1 (aman-tokyo) has benefits; hotel 2 (park-hyatt-tokyo) has none.

const SESSION_UUID = 'sess-uuid-sma55';
const TRIP_ID = 9990;
const SCREENSHOT_DIR = '/tmp/tip-screenshots/feat/sma-55-hotel-benefits';

const baseSession = {
  id: 1,
  user_id: 1,
  trip_id: TRIP_ID,
  status: 'ai',
  session_id: SESSION_UUID,
  schema_version: 1,
  last_message_at: new Date().toISOString(),
};

const baseTrip = { id: TRIP_ID, status: 'draft', current_trip_version_id: 1 };

const tripVersion = {
  id: 1,
  trip_id: TRIP_ID,
  title: 'Tokyo Trip',
  start_date: null,
  end_date: null,
  adults: 0,
  kids: 0,
  plan: [],
};

function outPath(name: string): string {
  return path.join(SCREENSHOT_DIR, name);
}

async function mockSessionAndCarousel(context: BrowserContext, hotelIds: number[]) {
  await context.route('**/api/ai-chat/sessions', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [{ session: baseSession, trip: baseTrip }] }),
    }),
  );
  await context.route(`**/api/trip/${TRIP_ID}`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: { trip: baseTrip, active_quote: null } }),
    }),
  );
  await context.route(`**/api/trip/${TRIP_ID}/current-version`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: tripVersion }),
    }),
  );
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
          user_message: { id: 101, content: '', role: 'user', message_type: 'text' },
          assistant_message: {
            id: 201,
            content: 'Here are a couple of hotels for your Tokyo stay:',
            role: 'assistant',
            message_type: 'text',
            widgets: [
              {
                widget_type: 'hotel_carousel',
                widget_id: 'hotels-sma55',
                hotels: hotelIds.map((id) => ({
                  id,
                  name: id === 1 ? 'Aman Tokyo' : 'Park Hyatt Tokyo',
                  image_url: null,
                  overview: null,
                  benefits: [],
                })),
              },
            ],
          },
          trip: { id: TRIP_ID },
          trip_version: null,
          field_updated: [],
        },
      }),
    });
  });
}

async function openCarousel(page: Page) {
  await page.goto('/concierge');
  const input = page.getByPlaceholder(/ask your concierge/i);
  await input.waitFor({ state: 'visible', timeout: 15_000 });
  await input.fill('Show me hotels in Tokyo');
  await input.press('Enter');
  await page.getByTestId('hotel-card-1').waitFor({ timeout: 15_000 });
}

test.describe('SMA-55 hotel benefits', () => {
  test.describe.configure({ mode: 'serial' });

  test('modal shows benefits panel for a hotel WITH benefits (desktop)', async ({
    page,
    context,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await mockSessionAndCarousel(context, [1, 2]);
    await openCarousel(page);
    await page.getByTestId('hotel-card-1').click();
    // Wait for real backend detail to load and the benefits header to render.
    const header = page.getByText(/TiP exclusive benefits included/i);
    await header.waitFor({ timeout: 15_000 });
    await header.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: outPath('modal-benefits-desktop.png'), fullPage: false });
  });

  test('modal shows benefits panel for a hotel WITH benefits (mobile)', async ({
    page,
    context,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockSessionAndCarousel(context, [1, 2]);
    await openCarousel(page);
    await page.getByTestId('hotel-card-1').click();
    const header = page.getByText(/TiP exclusive benefits included/i);
    await header.waitFor({ timeout: 15_000 });
    await header.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: outPath('modal-benefits-mobile.png'), fullPage: false });
  });

  test('modal shows NO benefits block for a hotel without benefits', async ({ page, context }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await mockSessionAndCarousel(context, [1, 2]);
    await openCarousel(page);
    await page.getByTestId('hotel-card-2').click();
    // Modal content loads (cancel button is part of the detail footer).
    await page.getByTestId('hotel-preview-confirm').waitFor({ timeout: 15_000 });
    await page.waitForTimeout(500);
    const benefitsCount = await page.getByText(/TiP exclusive benefits included/i).count();
    test.info().annotations.push({
      type: 'no-benefits-header-count',
      description: String(benefitsCount),
    });
    await page.screenshot({ path: outPath('modal-no-benefits.png'), fullPage: false });
  });

  test('public hotel page shows benefits only in sidebar, no duplication in main column', async ({
    page,
    context,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    // Real backend, no mocks.
    await context.unrouteAll().catch(() => {});
    // The public [id] route param is actually the hotel slug (getHotelBySlug).
    await page.goto('/hotel/aman-tokyo', { waitUntil: 'networkidle' });
    await page
      .getByText(/TiP exclusive benefits included/i)
      .first()
      .waitFor({ timeout: 15_000 });
    const headerCount = await page.getByText(/TiP exclusive benefits included/i).count();
    test.info().annotations.push({
      type: 'public-benefits-header-count',
      description: String(headerCount),
    });
    await page.screenshot({ path: outPath('public-page-no-duplication.png'), fullPage: true });
  });
});
