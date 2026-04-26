import { test, expect } from '@playwright/test';

const TRIP_ID = 9998;

const aiSession = {
  id: 11,
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
  title: 'Takeover Trip',
  start_date: null,
  end_date: null,
  adults: 0,
  kids: 0,
  plan: [],
};

test.describe('Concierge chat takeover -- customer-facing surface', () => {
  test('shows the human-takeover banner and renders Concierge Team for HUMAN_ASSISTANT messages', async ({
    context,
    page,
  }) => {
    // The session list endpoint reports the chat is in HUMAN mode -- the
    // banner must surface as soon as the page hydrates.
    await context.route('**/api/ai-chat/sessions', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [humanSession] }),
      });
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
        body: JSON.stringify({ data: tripVersion }),
      });
    });

    // Message history includes a HUMAN_ASSISTANT row -- the bubble must
    // render the generic Concierge Team badge, never an admin id.
    await context.route(`**/api/ai-chat/trips/${TRIP_ID}/messages`, async (route) => {
      if (route.request().method() !== 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { user_message: {}, assistant_message: null },
          }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 200,
              user_id: 1,
              trip_id: TRIP_ID,
              role: 'user',
              message_type: 'text',
              content: 'When is my check-in?',
              sent_at: '2026-04-22T10:00:00Z',
            },
            {
              id: 201,
              user_id: 1,
              trip_id: TRIP_ID,
              role: 'human_assistant',
              message_type: 'text',
              content: 'Your check-in is at 3pm.',
              sent_at: '2026-04-22T10:05:00Z',
              created_by_admin_id: 7,
            },
          ],
        }),
      });
    });

    await page.goto('/concierge');

    // Banner appears
    await expect(page.getByTestId('human-takeover-banner')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('human-takeover-banner')).toContainText(
      'A human concierge is taking over from here. The AI is paused.',
    );

    // HUMAN_ASSISTANT message renders with the generic Concierge Team badge.
    await expect(page.getByTestId('concierge-team-badge')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Your check-in is at 3pm.')).toBeVisible();

    // Admin id must NOT leak into the customer surface.
    const bubble = page.getByTestId('message-human-concierge');
    await expect(bubble).toBeVisible();
    await expect(bubble).not.toContainText('7');
    await expect(bubble).not.toContainText(/admin/i);
  });

  test('does not show the takeover banner when session.status is ai', async ({ context, page }) => {
    await context.route('**/api/ai-chat/sessions', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [aiSession] }),
      });
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
          data: { user_message: {}, assistant_message: null },
        }),
      });
    });

    await page.goto('/concierge');

    // The chat input must be ready (page has loaded).
    await expect(page.getByPlaceholder(/.+/).first()).toBeVisible({ timeout: 15000 });
    // Banner must not be present for AI-mode sessions.
    await expect(page.getByTestId('human-takeover-banner')).toHaveCount(0);
  });
});
