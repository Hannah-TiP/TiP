import { test, expect } from '@playwright/test';

const SESSION_UUID = 'sess-uuid-e2e';
const TRIP_ID = 9999;

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

test.describe('Concierge chat message flow', () => {
  test.beforeEach(async ({ context }) => {
    // Auth comes from storageState (see playwright.config.ts / global-setup.ts).
    // Only mock the chat/trip API surface that this spec exercises.
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

    let tripVersionState = tripVersion();

    await context.route(`**/api/trip/${TRIP_ID}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: baseTrip }),
      });
    });

    await context.route(`**/api/trip/${TRIP_ID}/current-version`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: tripVersionState }),
      });
    });

    let messageCallCount = 0;
    await context.route(`**/api/ai-chat/trips/${TRIP_ID}/messages`, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: [] }),
        });
        return;
      }

      messageCallCount += 1;
      const requestBody = JSON.parse(route.request().postData() || '{}');

      if (messageCallCount === 1) {
        // First call: text "Plan a trip to Paris" → assistant returns option_selector widget
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
                content: 'Sure! When would you like to travel?',
                role: 'assistant',
                message_type: 'text',
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
        // Update trip after first call so panel re-fetch shows destination
        tripVersionState = tripVersion({ title: 'Paris Trip' });
      } else {
        // Second call: widget interaction → assistant returns updated state with field highlight
        expect(requestBody.widget_response).toBeTruthy();
        expect(requestBody.widget_response.widget_type).toBe('option_selector');
        tripVersionState = tripVersion({ title: 'Paris Trip', summary: 'Leisure' });
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              user_message: {
                id: 102,
                content: '',
                role: 'user',
                message_type: 'text',
                widget_response: requestBody.widget_response,
              },
              assistant_message: {
                id: 103,
                content: 'Got it. Leisure trip noted.',
                role: 'assistant',
                message_type: 'text',
                widgets: [],
              },
              trip: { id: TRIP_ID },
              trip_version: null,
              field_updated: ['purpose'],
            },
          }),
        });
      }
    });
  });

  test('text → widget render → widget interact → trip highlight', async ({ page }) => {
    await page.goto('/concierge');

    // Type a message and send
    const input = page.getByPlaceholder(/.+/).first();
    await expect(input).toBeVisible({ timeout: 10_000 });
    await input.fill('Plan a trip to Paris');
    await input.press('Enter');

    // User message + assistant response appear (mock responds instantly so pending message may not render)
    await expect(page.getByText('Plan a trip to Paris')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Sure! When would you like to travel?')).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByTestId('option-leisure')).toBeVisible();

    // Click an option in the widget
    await page.getByTestId('option-leisure').click();

    // Optimistic user message for the widget interaction appears as a widget response badge
    await expect(page.getByTestId('widget-response-option-selector')).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByTestId('widget-response-option-selector')).toHaveText('leisure');

    // Assistant follow-up text appears
    await expect(page.getByText('Got it. Leisure trip noted.')).toBeVisible({
      timeout: 5000,
    });

    // Trip panel highlights the purpose row
    const purposeRow = page.getByTestId('trip-row-purpose');
    await expect(purposeRow).toBeVisible({ timeout: 5000 });
    await expect(purposeRow).toHaveClass(/bg-amber-100/);
  });
});

test.describe('Concierge Your Itinerary panel — detailed plan view', () => {
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

    const populatedVersion = tripVersion({
      title: 'Paris Trip',
      start_date: '2026-06-01',
      end_date: '2026-06-03',
      adults: 2,
      kids: 0,
      summary: 'Leisure',
      plan: [
        {
          date: '2026-06-01',
          title: 'Arrival Day',
          items: [
            {
              item_type: 'hotel',
              title: 'Ritz Paris',
              location: '15 Place Vendôme',
              start_at: '2026-06-01T15:00:00',
              end_at: null,
              description: 'Check in to the iconic hotel.',
            },
            {
              item_type: 'restaurant',
              title: 'Le Jules Verne',
              location: 'Eiffel Tower',
              start_at: '2026-06-01T19:30:00',
              end_at: '2026-06-01T22:00:00',
            },
          ],
        },
        {
          date: '2026-06-02',
          title: null,
          items: [],
        },
      ],
    });

    await context.route(`**/api/trip/${TRIP_ID}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: baseTrip }),
      });
    });

    await context.route(`**/api/trip/${TRIP_ID}/current-version`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: populatedVersion }),
      });
    });

    await context.route(`**/api/ai-chat/trips/${TRIP_ID}/messages`, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: [] }),
        });
      }
    });
  });

  test('renders detailed plan items and an empty-day note for days with no items', async ({
    page,
  }) => {
    await page.goto('/concierge');

    // Day 1 — populated
    const day1 = page.getByTestId('trip-day-0');
    await expect(day1).toBeVisible({ timeout: 10_000 });
    await expect(day1).toContainText('Arrival Day');

    const hotelItem = page.getByTestId('trip-plan-item-hotel-0');
    await expect(hotelItem).toBeVisible();
    await expect(hotelItem).toContainText('Hotel');
    await expect(hotelItem).toContainText('Ritz Paris');
    await expect(hotelItem).toContainText('15 Place Vendôme');
    await expect(hotelItem).toContainText('Check in to the iconic hotel.');

    const restaurantItem = page.getByTestId('trip-plan-item-restaurant-1');
    await expect(restaurantItem).toBeVisible();
    await expect(restaurantItem).toContainText('Restaurant');
    await expect(restaurantItem).toContainText('Le Jules Verne');

    // Day 2 — empty
    const day2 = page.getByTestId('trip-day-1');
    await expect(day2).toBeVisible();
    await expect(day2).toContainText('No items for this day');
  });
});
