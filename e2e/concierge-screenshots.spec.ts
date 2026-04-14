import { test, type Page, type BrowserContext } from '@playwright/test';
import path from 'node:path';

const SESSION_UUID = 'sess-uuid-screens';
const TRIP_ID = 9998;
const SCREENSHOT_DIR = '/tmp/tip-screenshots/feat/ai-chat-converse-v2';

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

function tripVersion(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    trip_id: TRIP_ID,
    title: 'Paris Trip',
    start_date: null,
    end_date: null,
    adults: 0,
    kids: 0,
    plan: [],
    ...overrides,
  };
}

function outPath(name: string): string {
  return path.join(SCREENSHOT_DIR, name);
}

type ConverseResponse = {
  response: string;
  ui_blocks?: unknown[];
  field_updated?: string[];
  assistant_message_id?: number;
  user_message_id?: number;
};

async function mockTripAndSession(
  context: BrowserContext,
  tripVersionRef: { current: ReturnType<typeof tripVersion> },
) {
  await context.route('**/api/ai-chat/sessions', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [baseSession] }),
    }),
  );
  await context.route(`**/api/ai-chat/trips/${TRIP_ID}/messages`, (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
    }
    return route.fulfill({ status: 200, body: '{}' });
  });
  await context.route(`**/api/trip/${TRIP_ID}`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: baseTrip }),
    }),
  );
  await context.route(`**/api/trip/${TRIP_ID}/current-version`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: tripVersionRef.current }),
    }),
  );
}

async function mockConverseSequence(context: BrowserContext, responses: ConverseResponse[]) {
  let call = 0;
  await context.route('**/api/ai-chat/converse', async (route) => {
    const r = responses[Math.min(call, responses.length - 1)];
    call += 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          session_id: SESSION_UUID,
          response: r.response,
          trip: { id: TRIP_ID },
          ui_blocks: r.ui_blocks ?? [],
          field_updated: r.field_updated ?? [],
          user_message_id: r.user_message_id ?? 100 + call,
          assistant_message_id: r.assistant_message_id ?? 200 + call,
        },
      }),
    });
  });
}

async function openConcierge(page: Page) {
  await page.goto('/concierge');
  const input = page.getByPlaceholder(/ask your concierge/i);
  await input.waitFor({ state: 'visible', timeout: 15_000 });
}

test.describe('Concierge visual captures', () => {
  test.describe.configure({ mode: 'serial' });

  test('01 initial load', async ({ page, context }) => {
    const tripRef = { current: tripVersion({ title: '' }) };
    await mockTripAndSession(context, tripRef);
    await mockConverseSequence(context, [{ response: '' }]);

    await openConcierge(page);
    await page.waitForTimeout(500);
    await page.screenshot({ path: outPath('01-initial.png'), fullPage: false });
  });

  test('02 text sent (optimistic user bubble)', async ({ page, context }) => {
    const tripRef = { current: tripVersion({ title: '' }) };
    await mockTripAndSession(context, tripRef);
    // Delay the assistant response so the optimistic user bubble is alone on screen
    let firstCall = true;
    await context.route('**/api/ai-chat/converse', async (route) => {
      if (firstCall) {
        firstCall = false;
        await new Promise((r) => setTimeout(r, 2500));
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            session_id: SESSION_UUID,
            response: 'Sure! When would you like to travel?',
            trip: { id: TRIP_ID },
            ui_blocks: [],
            field_updated: [],
            user_message_id: 100,
            assistant_message_id: 101,
          },
        }),
      });
    });

    await openConcierge(page);
    const input = page.getByPlaceholder(/ask your concierge/i);
    await input.fill('Plan a trip to Paris');
    await input.press('Enter');
    await page.getByText('Plan a trip to Paris').waitFor({ timeout: 5000 });
    // Brief pause so optimistic bubble + timestamp are rendered, before assistant response arrives
    await page.waitForTimeout(600);
    await page.screenshot({ path: outPath('02-text-sent.png'), fullPage: false });
  });

  test('03 assistant response with widget', async ({ page, context }) => {
    const tripRef = { current: tripVersion({ title: 'Paris Trip' }) };
    await mockTripAndSession(context, tripRef);
    await mockConverseSequence(context, [
      {
        response: 'Sure! What kind of trip is this?',
        ui_blocks: [
          {
            type: 'option_selector',
            id: 'opt-1',
            label: 'Pick a purpose',
            config: {
              options: [
                { value: 'leisure', label: 'Leisure' },
                { value: 'business', label: 'Business' },
                { value: 'family', label: 'Family' },
              ],
            },
          },
        ],
        field_updated: ['destination'],
      },
    ]);

    await openConcierge(page);
    const input = page.getByPlaceholder(/ask your concierge/i);
    await input.fill('Plan a trip to Paris');
    await input.press('Enter');
    await page.getByTestId('option-leisure').waitFor({ timeout: 10_000 });
    await page.waitForTimeout(400);
    await page.screenshot({ path: outPath('03-assistant-widget.png'), fullPage: false });
  });

  test('04 widget click (optimistic Leisure bubble)', async ({ page, context }) => {
    const tripRef = { current: tripVersion({ title: 'Paris Trip' }) };
    await mockTripAndSession(context, tripRef);
    let call = 0;
    await context.route('**/api/ai-chat/converse', async (route) => {
      call += 1;
      if (call === 1) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              session_id: SESSION_UUID,
              response: 'Sure! What kind of trip is this?',
              trip: { id: TRIP_ID },
              ui_blocks: [
                {
                  type: 'option_selector',
                  id: 'opt-1',
                  label: 'Pick a purpose',
                  config: {
                    options: [
                      { value: 'leisure', label: 'Leisure' },
                      { value: 'business', label: 'Business' },
                    ],
                  },
                },
              ],
              field_updated: ['destination'],
              user_message_id: 100,
              assistant_message_id: 101,
            },
          }),
        });
        return;
      }
      // Delay 2nd response so the optimistic "Leisure" user bubble is visible alone
      await new Promise((r) => setTimeout(r, 2500));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            session_id: SESSION_UUID,
            response: 'Got it. Leisure trip noted.',
            trip: { id: TRIP_ID },
            ui_blocks: [],
            field_updated: ['purpose'],
            user_message_id: 102,
            assistant_message_id: 103,
          },
        }),
      });
    });

    await openConcierge(page);
    const input = page.getByPlaceholder(/ask your concierge/i);
    await input.fill('Plan a trip to Paris');
    await input.press('Enter');
    await page.getByTestId('option-leisure').waitFor({ timeout: 10_000 });
    await page.getByTestId('option-leisure').click();
    // Wait for the optimistic "Leisure" paragraph bubble
    await page
      .getByRole('paragraph')
      .filter({ hasText: /^Leisure$/ })
      .waitFor({ timeout: 5000 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: outPath('04-widget-click.png'), fullPage: false });
  });

  test('05 widget disabled after follow-up', async ({ page, context }) => {
    const tripRef = { current: tripVersion({ title: 'Paris Trip' }) };
    await mockTripAndSession(context, tripRef);
    let call = 0;
    await context.route('**/api/ai-chat/converse', async (route) => {
      call += 1;
      if (call === 1) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              session_id: SESSION_UUID,
              response: 'Sure! What kind of trip is this?',
              trip: { id: TRIP_ID },
              ui_blocks: [
                {
                  type: 'option_selector',
                  id: 'opt-1',
                  label: 'Pick a purpose',
                  config: {
                    options: [
                      { value: 'leisure', label: 'Leisure' },
                      { value: 'business', label: 'Business' },
                    ],
                  },
                },
              ],
              field_updated: [],
              user_message_id: 100,
              assistant_message_id: 101,
            },
          }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            session_id: SESSION_UUID,
            response: 'Got it. Leisure trip noted. Anything else to adjust?',
            trip: { id: TRIP_ID },
            ui_blocks: [],
            field_updated: [],
            user_message_id: 102,
            assistant_message_id: 103,
          },
        }),
      });
    });

    await openConcierge(page);
    const input = page.getByPlaceholder(/ask your concierge/i);
    await input.fill('Plan a trip to Paris');
    await input.press('Enter');
    await page.getByTestId('option-leisure').waitFor({ timeout: 10_000 });
    await page.getByTestId('option-leisure').click();
    // Wait for follow-up assistant message — at which point the first widget is no longer last
    await page.getByText('Got it. Leisure trip noted. Anything else to adjust?').waitFor({
      timeout: 10_000,
    });
    // Wait past the trip-row highlight (2s) so the row is back to neutral
    await page.waitForTimeout(2400);
    await page.screenshot({ path: outPath('05-widget-disabled.png'), fullPage: false });
  });

  test('06 trip panel mid-highlight', async ({ page, context }) => {
    const tripRef = { current: tripVersion({ title: 'Paris Trip' }) };
    await context.route('**/api/ai-chat/sessions', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [baseSession] }),
      }),
    );
    await context.route(`**/api/ai-chat/trips/${TRIP_ID}/messages`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      }),
    );
    await context.route(`**/api/trip/${TRIP_ID}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: baseTrip }),
      }),
    );
    await context.route(`**/api/trip/${TRIP_ID}/current-version`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: tripRef.current }),
      }),
    );
    await context.route('**/api/ai-chat/converse', async (route) => {
      // Update trip on this call so TripDetailPanel refetches with new purpose
      tripRef.current = tripVersion({ title: 'Paris Trip', summary: 'Leisure' });
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            session_id: SESSION_UUID,
            response: 'Got it. Leisure trip noted.',
            trip: { id: TRIP_ID },
            ui_blocks: [],
            field_updated: ['purpose'],
            user_message_id: 100,
            assistant_message_id: 101,
          },
        }),
      });
    });

    await openConcierge(page);
    const input = page.getByPlaceholder(/ask your concierge/i);
    await input.fill('It is a leisure trip');
    await input.press('Enter');
    // Wait for purpose row to be highlighted, then snap mid-animation
    const purposeRow = page.getByTestId('trip-row-purpose');
    await purposeRow.waitFor({ timeout: 10_000 });
    await page.waitForFunction(
      () => {
        const el = document.querySelector('[data-testid="trip-row-purpose"]');
        return !!el && el.className.includes('bg-amber-100');
      },
      null,
      { timeout: 5000 },
    );
    // ~halfway through the 2s highlight window
    await page.waitForTimeout(700);
    await page.screenshot({ path: outPath('06-trip-highlight.png'), fullPage: false });
  });

  test('07 multiple widget types in one response', async ({ page, context }) => {
    const tripRef = { current: tripVersion({ title: 'Paris Trip' }) };
    await mockTripAndSession(context, tripRef);
    await mockConverseSequence(context, [
      {
        response: 'Here are a few things I need from you:',
        ui_blocks: [
          {
            type: 'date_range_picker',
            id: 'dates-1',
            label: 'Pick your dates',
            config: { start_date: null, end_date: null },
          },
          {
            type: 'number_stepper',
            id: 'travelers-1',
            label: 'How many travelers?',
            config: {
              fields: [
                { key: 'adults', label: 'Adults', min: 1, max: 10, default: 2 },
                { key: 'kids', label: 'Kids', min: 0, max: 10, default: 0 },
              ],
            },
          },
          {
            type: 'hotel_carousel',
            id: 'hotels-1',
            label: 'Pick a hotel you like',
            config: {
              hotels: [
                {
                  id: 1,
                  name: { en: 'Hôtel Plaza Athénée', kr: '' },
                  star_rating: 5,
                  images: [
                    'https://images.unsplash.com/photo-1455587734955-081b22074882?w=400&h=200&fit=crop',
                  ],
                },
                {
                  id: 2,
                  name: { en: 'Le Bristol Paris', kr: '' },
                  star_rating: 5,
                  images: [
                    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&h=200&fit=crop',
                  ],
                },
                {
                  id: 3,
                  name: { en: 'Ritz Paris', kr: '' },
                  star_rating: 5,
                  images: [
                    'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400&h=200&fit=crop',
                  ],
                },
              ],
            },
          },
        ],
      },
    ]);

    await openConcierge(page);
    const input = page.getByPlaceholder(/ask your concierge/i);
    await input.fill('Help me plan Paris');
    await input.press('Enter');
    await page.getByTestId('hotel-card-1').waitFor({ timeout: 10_000 });
    await page.waitForTimeout(800);
    await page.screenshot({ path: outPath('07-multi-widgets.png'), fullPage: false });
  });

  test('08 multi-bubble timestamps', async ({ page, context }) => {
    const tripRef = { current: tripVersion({ title: 'Paris Trip' }) };
    await mockTripAndSession(context, tripRef);
    let call = 0;
    await context.route('**/api/ai-chat/converse', async (route) => {
      call += 1;
      if (call === 1) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              session_id: SESSION_UUID,
              response: 'Lovely choice. Paris is wonderful in spring.',
              trip: { id: TRIP_ID },
              ui_blocks: [],
              field_updated: [],
              user_message_id: 100,
              assistant_message_id: 101,
            },
          }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            session_id: SESSION_UUID,
            response: 'Got it — two adults it is.',
            trip: { id: TRIP_ID },
            ui_blocks: [],
            field_updated: [],
            user_message_id: 102,
            assistant_message_id: 103,
          },
        }),
      });
    });

    await openConcierge(page);
    const input = page.getByPlaceholder(/ask your concierge/i);
    await input.fill('Plan a trip to Paris');
    await input.press('Enter');
    await page.getByText('Lovely choice. Paris is wonderful in spring.').waitFor({
      timeout: 10_000,
    });
    await input.fill('We are two adults');
    await input.press('Enter');
    await page.getByText('Got it — two adults it is.').waitFor({ timeout: 10_000 });
    await page.waitForTimeout(600);
    await page.screenshot({ path: outPath('08-timestamps.png'), fullPage: false });
  });
});
