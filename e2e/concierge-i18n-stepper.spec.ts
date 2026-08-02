import { test, expect } from '@playwright/test';
import { gotoPage } from './support/navigation';

// SMA-150: the AI-concierge passenger-count stepper must render localized
// "Adults (12+)" / "Kids (under 12)" labels — never the English backend-supplied
// field.label — when the app is in Korean mode.

const SESSION_UUID = 'sess-uuid-i18n';
const TRIP_ID = 8888;

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
  plan: [],
};

test.describe('Concierge passenger picker — Korean i18n', () => {
  test.beforeEach(async ({ context }) => {
    // Force Korean mode before any page script runs.
    await context.addInitScript(() => {
      window.localStorage.setItem('tip-lang', 'kr');
    });

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

      // POST: assistant responds with a number_stepper carrying the English
      // backend labels — the FE must localize these in KR mode.
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            user_message: {
              id: 100,
              content: 'Two adults',
              role: 'user',
              message_type: 'text',
            },
            assistant_message: {
              id: 101,
              content: 'How many travelers?',
              role: 'assistant',
              message_type: 'text',
              widgets: [
                {
                  widget_type: 'number_stepper',
                  widget_id: 'step-1',
                  fields: [
                    { key: 'adults', label: 'Adults (12+)', min: 1, max: 10, default: 2 },
                    { key: 'kids', label: 'Kids (under 12)', min: 0, max: 6, default: 0 },
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
    });
  });

  test('renders 성인 / 어린이 labels (not English) in the stepper', async ({ page }) => {
    await gotoPage(page, '/concierge');

    const input = page.getByPlaceholder(/.+/).first();
    await expect(input).toBeVisible({ timeout: 10_000 });
    await input.fill('Two adults');
    await input.press('Enter');

    // The stepper appears with localized passenger labels.
    await expect(page.getByTestId('stepper-value-adults')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('성인 (만 12세 이상)')).toBeVisible();
    await expect(page.getByText('어린이 (만 12세 미만)')).toBeVisible();

    // The English backend labels must not leak through in KR mode.
    await expect(page.getByText('Adults (12+)')).toHaveCount(0);
    await expect(page.getByText('Kids (under 12)')).toHaveCount(0);
  });
});
