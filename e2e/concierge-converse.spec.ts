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
        body: JSON.stringify({ success: true, data: [baseSession] }),
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
              user_message: { id: 100, content: 'Plan a trip to Paris', role: 'user' },
              assistant_message: {
                id: 101,
                content: 'Sure! When would you like to travel?',
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

    // Optimistic user message appears
    await expect(page.getByText('Plan a trip to Paris')).toBeVisible({ timeout: 5000 });

    // Assistant text + widget appears
    await expect(page.getByText('Sure! When would you like to travel?')).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByTestId('option-leisure')).toBeVisible();

    // Click an option in the widget
    await page.getByTestId('option-leisure').click();

    // Optimistic user message for the widget interaction appears as a widget response badge
    await expect(page.getByTestId('widget-response-option-selector')).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByTestId('widget-response-option-selector')).toHaveText('Leisure');

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
