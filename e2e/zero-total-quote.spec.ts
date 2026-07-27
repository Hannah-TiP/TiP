import { test, expect } from '@playwright/test';

/**
 * Zero-total quote completion (SMA-237).
 *
 * With the credit redemption cap removed, an applied stay credit can cover a
 * booking's full total. On such a SENT quote the Pay-now button must NOT open
 * the Flywire checkout flow — clicking it calls the $0 mark-paid endpoint and
 * the page flips to the PAID state in place.
 *
 * The test agent seeds a SENT quote for the E2E user whose snapshot total is
 * 0 (fully covered by an applied credit) and provides its id via:
 *   - E2E_QUOTE_ZERO_TOTAL_ID
 *
 * Optionally, when the seeded credit's face value EXCEEDS the amount owed
 * (e.g. a $500 credit on a $100 booking), the applied-credit display test is
 * enabled via:
 *   - E2E_ZERO_TOTAL_APPLIED_AMOUNT  (amount actually applied, e.g. "100.00")
 *   - E2E_ZERO_TOTAL_FACE_AMOUNT     (credit face value, e.g. "500.00")
 *
 * Each test is gated on its seed vars so the suite skips cleanly when they
 * are absent — bare PR CI has no backend and none of .env.local.
 */

const ZERO_TOTAL_QUOTE_ID = process.env.E2E_QUOTE_ZERO_TOTAL_ID;
const APPLIED_AMOUNT = process.env.E2E_ZERO_TOTAL_APPLIED_AMOUNT;
const FACE_AMOUNT = process.env.E2E_ZERO_TOTAL_FACE_AMOUNT;

test.describe('Zero-total quote', () => {
  test('Pay now marks the quote PAID in place without opening Flywire', async ({ page }) => {
    test.skip(!ZERO_TOTAL_QUOTE_ID, 'E2E_QUOTE_ZERO_TOTAL_ID is not set; skipping');

    // Stub the $0 mark-paid endpoint so the test doesn't consume the seeded
    // fixture (the real endpoint transitions the quote to PAID permanently).
    let zeroTotalCalled = false;
    await page.route('**/api/quotes/*/zero-total-payment', async (route) => {
      zeroTotalCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            quote: {
              id: Number(ZERO_TOTAL_QUOTE_ID),
              trip_id: 1,
              trip_version_id: 1,
              user_id: 1,
              current_quote_version_id: 1,
              status: 'PAID',
              paid_at: new Date().toISOString(),
              schema_version: 1,
            },
            current_version: {
              id: 1,
              quote_id: Number(ZERO_TOTAL_QUOTE_ID),
              version_number: 2,
              line_items: [],
              total_snapshot: {
                currency: 'USD',
                subtotal: '200.00',
                fees: [],
                discounts: [
                  {
                    label: 'Stay credit (manual, USD 100.00)',
                    amount: '100.00',
                    kind: 'stay_credit',
                  },
                  {
                    label: 'Benefit credit (carte, USD 100.00)',
                    amount: '100.00',
                    kind: 'benefit_credit',
                  },
                ],
                total: '0.00',
              },
              applied_stay_credit_ids: [],
              schema_version: 1,
            },
          },
        }),
      });
    });

    // The Flywire checkout-session endpoint must never be hit on a $0 quote.
    let checkoutSessionCalled = false;
    await page.route('**/api/quotes/*/checkout-session', async (route) => {
      checkoutSessionCalled = true;
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'checkout-session must not be called on a $0 quote' }),
      });
    });

    await page.goto(`/quotes/${ZERO_TOTAL_QUOTE_ID}`);

    // AC6: the pay button REMAINS visible on a $0-total SENT quote.
    const payNow = page.getByTestId('pay-now-button');
    await expect(payNow).toBeVisible({ timeout: 15_000 });

    await payNow.click();

    // The page flips to the PAID state in place (onPaid swaps the bundle).
    await expect(page.getByTestId('quote-paid-indicator')).toBeVisible({ timeout: 15_000 });

    // The $0 mark-paid endpoint was called; Flywire never was.
    expect(zeroTotalCalled).toBe(true);
    expect(checkoutSessionCalled).toBe(false);
    expect(page.url()).not.toContain('/checkout/flywire');

    // No Pay-now button on a PAID quote.
    await expect(page.getByTestId('pay-now-button')).toHaveCount(0);
  });

  test('applied-credit panel shows the APPLIED amount, with the face value when they diverge', async ({
    page,
  }) => {
    test.skip(
      !ZERO_TOTAL_QUOTE_ID || !APPLIED_AMOUNT,
      'E2E_QUOTE_ZERO_TOTAL_ID / E2E_ZERO_TOTAL_APPLIED_AMOUNT not set; skipping',
    );

    // No stubs — this asserts against the real seeded snapshot + eligibility.
    await page.goto(`/quotes/${ZERO_TOTAL_QUOTE_ID}`);

    const applied = page.getByTestId('applied-credit');
    await expect(applied).toBeVisible({ timeout: 15_000 });

    // The panel shows the amount actually applied (from the snapshot's
    // stay-credit discount line), not the credit's face value.
    await expect(applied).toContainText(APPLIED_AMOUNT as string);

    if (FACE_AMOUNT && FACE_AMOUNT !== APPLIED_AMOUNT) {
      // Diverging fixture ($500 credit on a $100 booking): both figures
      // render — "{face} credit — {applied} applied".
      await expect(applied).toContainText(FACE_AMOUNT);
    }
  });
});
