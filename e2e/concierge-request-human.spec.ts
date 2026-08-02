import { test, expect } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

const TRIP_ID = 9997;
const SCREENSHOT_DIR = '/tmp/tip-screenshots/feat/request-human-concierge';

const aiSession = {
  id: 20,
  user_id: 1,
  trip_id: TRIP_ID,
  status: 'ai',
  schema_version: 1,
  last_message_at: new Date().toISOString(),
};

const humanSession = { ...aiSession, status: 'human' };

const baseTrip = {
  id: TRIP_ID,
  status: 'draft',
  current_trip_version_id: 1,
};

const tripVersion = {
  id: 1,
  trip_id: TRIP_ID,
  title: 'Request Human Trip',
  start_date: null,
  end_date: null,
  adults: 0,
  kids: 0,
  plan: [],
};

const expectAssistantMsg = {
  id: 300,
  user_id: 1,
  trip_id: TRIP_ID,
  role: 'assistant',
  message_type: 'text',
  content: 'A concierge will respond shortly — they may not be available immediately.',
  sent_at: new Date().toISOString(),
};

function outPath(name: string): string {
  return path.join(SCREENSHOT_DIR, name);
}

test.describe('Customer-initiated request for human concierge', () => {
  test.beforeAll(() => {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  });

  test('click CTA -> confirm modal -> status banner + assistant message appear, CTA gone', async ({
    context,
    page,
  }) => {
    let requestCount = 0;

    // Sessions: start as AI, flip to HUMAN after the request
    await context.route('**/api/ai-chat/sessions', async (route) => {
      const session = requestCount > 0 ? humanSession : aiSession;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [{ session, trip: baseTrip }],
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

    // Messages: empty at start, then include the expectation-setter after the request
    await context.route(`**/api/ai-chat/trips/${TRIP_ID}/messages`, async (route) => {
      if (route.request().method() === 'GET') {
        const msgs = requestCount > 0 ? [expectAssistantMsg] : [];
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: msgs }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { user_message: {}, assistant_message: null },
        }),
      });
    });

    // request-human endpoint
    await context.route(`**/api/ai-chat/trips/${TRIP_ID}/request-human`, async (route) => {
      requestCount++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            session: humanSession,
            assistant_message: expectAssistantMsg,
          },
        }),
      });
    });

    await page.goto('/concierge');

    // CTA must be visible in AI mode
    const cta = page.getByTestId('request-human-cta');
    await expect(cta).toBeVisible({ timeout: 15000 });

    await page.screenshot({ path: outPath('01-ai-mode-cta-visible.png'), fullPage: true });

    // Click CTA
    await cta.click();

    // Modal opens
    await expect(page.getByTestId('request-human-modal')).toBeVisible({ timeout: 5000 });

    await page.screenshot({ path: outPath('02-confirm-modal-open.png'), fullPage: true });

    // Confirm
    await page.getByTestId('request-human-confirm').click();

    // After confirm: CTA disappears, banner appears, assistant message visible
    await expect(page.getByTestId('human-takeover-banner')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(expectAssistantMsg.content)).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('request-human-cta')).toHaveCount(0);

    await page.screenshot({ path: outPath('03-human-mode-banner-visible.png'), fullPage: true });
  });
});
