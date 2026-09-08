import { test, expect } from '@playwright/test';
import { gotoPage } from './support/navigation';

// SMA-322: /my-page/membership renders its money figures from the benefit
// registry payload (GET /api/benefits proxy) and shows the signed-in
// member's own earn rate from the `resolved` block. Runs in the
// chromium-authed project; the proxy route is stubbed so the spec is
// deterministic and independent of the seeded account's tier.

const BENEFITS_PAYLOAD = {
  benefits: [
    {
      key: 'benefit_credit',
      kind: 'per_booking_discount',
      unit: 'usd_cents',
      // Carte deliberately differs from the static fallback so a
      // payload-driven render is distinguishable from the fallback path.
      values_by_tier: { carte: '12300', cercle: '15000', confidence: '20000', cenacle: '40000' },
      copy: { en: 'Booking credit.', kr: '베네핏 크레딧.' },
    },
    {
      key: 'tiered_earn',
      kind: 'earn_rate',
      unit: 'rate',
      values_by_tier: { carte: '0.001', cercle: '0.005', confidence: '0.01', cenacle: '0.015' },
      copy: { en: 'Earn credit.', kr: '적립.' },
    },
  ],
  resolved: {
    tier: 'carte',
    benefits: [{ key: 'tiered_earn', unit: 'rate', value: '0.001' }],
  },
};

test.describe('Benefit figures on /my-page/membership', () => {
  test('renders payload figures and the member earn-rate line', async ({ page }) => {
    await page.route('**/api/benefits', async (route) => {
      if (route.request().method() !== 'GET') return route.fallback();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, message: 'Success', data: BENEFITS_PAYLOAD }),
      });
    });

    await gotoPage(page, '/my-page/membership');

    // Carte card money figure comes from the stubbed payload, not the
    // static fallback.
    await expect(page.getByText(/Stay Credit — \$123 hotel credit per stay/)).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId('member-earn-rate')).toHaveText(
      'You earn 0.1% on travel spend as a Carte member.',
    );
  });

  test('degrades to static figures when the endpoint is unavailable', async ({ page }) => {
    await page.route('**/api/benefits', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'down' }),
      });
    });

    await gotoPage(page, '/my-page/membership');

    // Fallback figures render — never blank/crash.
    await expect(page.getByText(/Stay Credit — \$100 hotel credit per stay/)).toBeVisible({
      timeout: 15_000,
    });
    // No resolved block ⇒ no personal earn-rate line.
    await expect(page.getByTestId('member-earn-rate')).toHaveCount(0);
  });
});
