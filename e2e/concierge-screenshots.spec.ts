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

type MockChatResponse = {
  response: string;
  widgets?: unknown[];
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

async function mockChatSequence(context: BrowserContext, responses: MockChatResponse[]) {
  let call = 0;
  await context.route(`**/api/ai-chat/trips/${TRIP_ID}/messages`, async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
      return;
    }
    const r = responses[Math.min(call, responses.length - 1)];
    call += 1;
    const umId = r.user_message_id ?? 100 + call;
    const amId = r.assistant_message_id ?? 200 + call;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          user_message: { id: umId, content: '', role: 'user' },
          assistant_message: {
            id: amId,
            content: r.response,
            role: 'assistant',
            widgets: r.widgets ?? [],
          },
          trip: { id: TRIP_ID },
          trip_version: null,
          field_updated: r.field_updated ?? [],
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
    await mockChatSequence(context, [{ response: '' }]);

    await openConcierge(page);
    await page.waitForTimeout(500);
    await page.screenshot({ path: outPath('01-initial.png'), fullPage: false });
  });

  test('02 text sent (optimistic user bubble)', async ({ page, context }) => {
    const tripRef = { current: tripVersion({ title: '' }) };
    await mockTripAndSession(context, tripRef);
    // Delay the assistant response so the optimistic user bubble is alone on screen
    let firstCall = true;
    await context.route(`**/api/ai-chat/trips/${TRIP_ID}/messages`, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: [] }),
        });
        return;
      }
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
            user_message: { id: 100, content: '', role: 'user' },
            assistant_message: {
              id: 101,
              content: 'Sure! When would you like to travel?',
              role: 'assistant',
              widgets: [],
            },
            trip: { id: TRIP_ID },
            trip_version: null,
            field_updated: [],
          },
        }),
      });
    });

    await openConcierge(page);
    const input = page.getByPlaceholder(/ask your concierge/i);
    await input.fill('Plan a trip to Paris');
    await input.press('Enter');
    await page.getByText('Plan a trip to Paris').waitFor({ timeout: 10_000 });
    // Brief pause so optimistic bubble + timestamp are rendered, before assistant response arrives
    await page.waitForTimeout(600);
    await page.screenshot({ path: outPath('02-text-sent.png'), fullPage: false });
  });

  test('03 assistant response with widget', async ({ page, context }) => {
    const tripRef = { current: tripVersion({ title: 'Paris Trip' }) };
    await mockTripAndSession(context, tripRef);
    await mockChatSequence(context, [
      {
        response: 'Sure! What kind of trip is this?',
        widgets: [
          {
            widget_type: 'option_selector',
            widget_id: 'opt-1',
            label: 'Pick a purpose',
            options: [
              { value: 'leisure', label: 'Leisure' },
              { value: 'business', label: 'Business' },
              { value: 'family', label: 'Family' },
            ],
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
    await context.route(`**/api/ai-chat/trips/${TRIP_ID}/messages`, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: [] }),
        });
        return;
      }
      call += 1;
      if (call === 1) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              user_message: { id: 100, content: '', role: 'user' },
              assistant_message: {
                id: 101,
                content: 'Sure! What kind of trip is this?',
                role: 'assistant',
                widgets: [
                  {
                    widget_type: 'option_selector',
                    widget_id: 'opt-1',
                    label: 'Pick a purpose',
                    options: [
                      { value: 'leisure', label: 'Leisure' },
                      { value: 'business', label: 'Business' },
                    ],
                  },
                ],
              },
              trip: { id: TRIP_ID },
              trip_version: null,
              field_updated: ['destination'],
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
            user_message: { id: 102, content: '', role: 'user' },
            assistant_message: {
              id: 103,
              content: 'Got it. Leisure trip noted.',
              role: 'assistant',
              widgets: [],
            },
            trip: { id: TRIP_ID },
            trip_version: null,
            field_updated: ['purpose'],
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
    // Wait for the widget response badge to appear
    await page
      .getByTestId('widget-response-option-selector')
      .waitFor({ timeout: 5000 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: outPath('04-widget-click.png'), fullPage: false });
  });

  test('05 widget disabled after follow-up', async ({ page, context }) => {
    const tripRef = { current: tripVersion({ title: 'Paris Trip' }) };
    await mockTripAndSession(context, tripRef);
    let call = 0;
    await context.route(`**/api/ai-chat/trips/${TRIP_ID}/messages`, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: [] }),
        });
        return;
      }
      call += 1;
      if (call === 1) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              user_message: { id: 100, content: '', role: 'user' },
              assistant_message: {
                id: 101,
                content: 'Sure! What kind of trip is this?',
                role: 'assistant',
                widgets: [
                  {
                    widget_type: 'option_selector',
                    widget_id: 'opt-1',
                    label: 'Pick a purpose',
                    options: [
                      { value: 'leisure', label: 'Leisure' },
                      { value: 'business', label: 'Business' },
                    ],
                  },
                ],
              },
              trip: { id: TRIP_ID },
              trip_version: null,
              field_updated: [],
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
            user_message: { id: 102, content: '', role: 'user' },
            assistant_message: {
              id: 103,
              content: 'Got it. Leisure trip noted. Anything else to adjust?',
              role: 'assistant',
              widgets: [],
            },
            trip: { id: TRIP_ID },
            trip_version: null,
            field_updated: [],
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
    await context.route(`**/api/ai-chat/trips/${TRIP_ID}/messages`, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: [] }),
        });
        return;
      }
      // Update trip on this call so TripDetailPanel refetches with new purpose
      tripRef.current = tripVersion({ title: 'Paris Trip', summary: 'Leisure' });
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            user_message: { id: 100, content: '', role: 'user' },
            assistant_message: {
              id: 101,
              content: 'Got it. Leisure trip noted.',
              role: 'assistant',
              widgets: [],
            },
            trip: { id: TRIP_ID },
            trip_version: null,
            field_updated: ['purpose'],
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
    await mockChatSequence(context, [
      {
        response: 'Here are a few things I need from you:',
        widgets: [
          {
            widget_type: 'date_range_picker',
            widget_id: 'dates-1',
            min_date: null,
            max_date: null,
          },
          {
            widget_type: 'number_stepper',
            widget_id: 'travelers-1',
            fields: [
              { key: 'adults', label: 'Adults', min: 1, max: 10, default: 2 },
              { key: 'kids', label: 'Kids', min: 0, max: 10, default: 0 },
            ],
          },
          {
            widget_type: 'hotel_carousel',
            widget_id: 'hotels-1',
            hotel_ids: [1, 2, 3],
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
    await context.route(`**/api/ai-chat/trips/${TRIP_ID}/messages`, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: [] }),
        });
        return;
      }
      call += 1;
      if (call === 1) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              user_message: { id: 100, content: '', role: 'user' },
              assistant_message: {
                id: 101,
                content: 'Lovely choice. Paris is wonderful in spring.',
                role: 'assistant',
                widgets: [],
              },
              trip: { id: TRIP_ID },
              trip_version: null,
              field_updated: [],
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
            user_message: { id: 102, content: '', role: 'user' },
            assistant_message: {
              id: 103,
              content: 'Got it — two adults it is.',
              role: 'assistant',
              widgets: [],
            },
            trip: { id: TRIP_ID },
            trip_version: null,
            field_updated: [],
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
