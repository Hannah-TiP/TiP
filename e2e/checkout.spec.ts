import { test, expect } from '@playwright/test';

/**
 * Flywire checkout flow e2e.
 *
 * The test agent seeds three quote/payment fixtures for the E2E user before
 * running this spec and provides their ids via env vars:
 *   - E2E_QUOTE_SENT_ID:    a SENT quote (for the Pay-now button test)
 *   - E2E_QUOTE_PAID_ID:    a PAID quote (for the polling/return-URL test)
 *   - E2E_PAYMENT_PENDING_ID: a PENDING QuotePayment whose linked quote is SENT
 *
 * Each test is gated on its own seed var so the suite stays useful even if
 * the test agent only seeds a subset.
 */

const SENT_QUOTE_ID = process.env.E2E_QUOTE_SENT_ID;
const PAID_QUOTE_ID = process.env.E2E_QUOTE_PAID_ID;
const PENDING_PAYMENT_ID = process.env.E2E_PAYMENT_PENDING_ID;

test.describe('Flywire checkout', () => {
  test('Pay-now button on a SENT quote redirects to /checkout/flywire', async ({ page }) => {
    test.skip(!SENT_QUOTE_ID, 'E2E_QUOTE_SENT_ID is not set; skipping');

    // Stub the checkout-session endpoint so we don't need to hit Flywire's
    // demo provider (and don't burn through real session ids).
    await page.route('**/api/quotes/*/checkout-session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            checkout_url: '/checkout/flywire?payment_id=999',
            payment_id: 999,
          },
        }),
      });
    });

    await page.goto(`/quotes/${SENT_QUOTE_ID}`);
    const payNow = page.getByTestId('pay-now-button');
    await expect(payNow).toBeVisible({ timeout: 15_000 });

    await Promise.all([
      page.waitForURL(/\/checkout\/flywire\?payment_id=/, { timeout: 15_000 }),
      payNow.click(),
    ]);

    expect(page.url()).toContain('/checkout/flywire?payment_id=');
  });

  test('?paid=1 on a PAID quote shows the success state', async ({ page }) => {
    test.skip(!PAID_QUOTE_ID, 'E2E_QUOTE_PAID_ID is not set; skipping');

    await page.goto(`/quotes/${PAID_QUOTE_ID}?paid=1`);

    // Polling either flips to PAID immediately (if the quote is already PAID
    // when the first /api/quotes call resolves) or after a poll cycle. Either
    // way, the indicator must surface within ~5s.
    await expect(page.getByTestId('quote-paid-indicator')).toBeVisible({ timeout: 5_000 });

    // No Pay-now button on a PAID quote.
    await expect(page.getByTestId('pay-now-button')).toHaveCount(0);
  });

  test('/checkout/flywire renders the container + injects the script', async ({ page }) => {
    test.skip(!PENDING_PAYMENT_ID, 'E2E_PAYMENT_PENDING_ID is not set; skipping');

    // Stub the widget-config response so the page mounts even if the seeded
    // payment isn't in a state the backend will return widget-config for. We
    // only assert structural rendering here, not the actual Flywire widget.
    await page.route('**/api/payments/*/widget-config', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            portal_code: 'TIP',
            amount: '100.00',
            currency: 'USD',
            callback_url: 'https://api.example.com/api/v2/webhooks/flywire',
            callback_id: PENDING_PAYMENT_ID,
            callback_version: '2',
            return_url: 'https://example.com/quotes/1?paid=1',
            cancel_url: 'https://example.com/quotes/1?cancelled=1',
            booking_reference: PENDING_PAYMENT_ID,
          },
        }),
      });
    });

    await page.goto(`/checkout/flywire?payment_id=${PENDING_PAYMENT_ID}`);

    // Header is present.
    await expect(page.getByRole('heading', { name: /complete payment/i })).toBeVisible({
      timeout: 15_000,
    });

    // Container div is in the DOM (we don't try to render the real widget).
    await expect(page.getByTestId('flywire-checkout-container')).toBeVisible();

    // Flywire script tag was injected. next/script renders <script src=...>
    // somewhere in the document; assert at least one matching tag.
    const scriptCount = await page.locator('script[src*="flywire-payment"]').count();
    expect(scriptCount).toBeGreaterThan(0);
  });
});
