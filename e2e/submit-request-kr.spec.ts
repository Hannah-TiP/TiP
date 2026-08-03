import { test, expect } from '@playwright/test';

import { gotoPage } from './support/navigation';

/**
 * SMA-260 — KR Submit Request end-to-end.
 *
 * The hotel page's Submit Request CTA persists an assistant confirmation
 * message into the trip's chat thread. Before this fix the Next proxy
 * hardcoded `Language: 'en'`, so every Korean user's first concierge message
 * was stored in English, permanently. This spec drives the REAL backend
 * (authed project, no route mocks on the submit path): with the UI in KR,
 * submitting a request must land a Korean confirmation message in the thread.
 *
 * Runs in the chromium-authed project against a deployed/full-stack target;
 * skips itself when the seeded hotel page is unavailable (bare-CI safety).
 */

const HOTEL_SLUG = process.env.E2E_HOTEL_SLUG || 'aman-tokyo';
const HANGUL = /[가-힣]/;

function isoDatePlus(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

test.describe('Submit Request in Korean', () => {
  test.beforeEach(async ({ page }) => {
    // Force the KR UI before any page script runs (localStorage rung of the
    // language ladder — the authoritative user choice).
    await page.addInitScript(() => {
      window.localStorage.setItem('tip-lang', 'kr');
      window.localStorage.setItem('tip-cookie-consent', 'accepted');
    });
  });

  test('persists a Korean confirmation message into the chat thread', async ({ page }) => {
    // SMA-257: gotoPage waits out React's streaming reveal (both the `B:`
    // boundary template and the `S:` staging buffer) before the test touches
    // the page, and still returns the navigation response for the skip check.
    const detailResponse = await gotoPage(page, `/hotel/${HOTEL_SLUG}`);
    test.skip(
      !detailResponse || !detailResponse.ok(),
      `Hotel /hotel/${HOTEL_SLUG} not available in this environment`,
    );

    const checkIn = page.locator('#hotel-booking-checkin');
    await checkIn.scrollIntoViewIfNeeded();
    await checkIn.fill(isoDatePlus(30));
    await page.locator('#hotel-booking-checkout').fill(isoDatePlus(33));

    // KR label for hotel.booking_submit_request_cta.
    const submitButton = page.getByRole('button', { name: '요청 보내기' }).first();
    await expect(submitButton).toBeVisible();
    await submitButton.click();

    // The flow creates a real trip and routes to its concierge thread. The
    // first uncached backend round-trip can be slow on a cold deploy.
    await page.waitForURL(/\/concierge\?trip_id=\d+/, { timeout: 45_000 });

    // The seeded confirmation message is PERSISTED by the backend and read
    // back via GET messages — asserting it here asserts the stored copy,
    // not a client-side translation.
    const messageList = page.getByTestId('message-list-container');
    await expect(messageList).toBeVisible({ timeout: 30_000 });
    await expect(async () => {
      const text = (await messageList.innerText()).trim();
      expect(text.length).toBeGreaterThan(0);
      expect(text).toMatch(HANGUL);
    }).toPass({ timeout: 30_000 });

    // Reload to prove the Korean copy is what the backend stored (a fresh
    // history fetch, no residue from the submit response).
    await page.reload();
    await expect(page.getByTestId('message-list-container')).toBeVisible({ timeout: 30_000 });
    await expect
      .poll(async () => (await page.getByTestId('message-list-container').innerText()).trim(), {
        timeout: 30_000,
      })
      .toMatch(HANGUL);
  });
});
