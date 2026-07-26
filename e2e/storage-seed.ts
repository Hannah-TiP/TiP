// Shared localStorage seed for e2e specs. Pre-dismisses the fixed-position
// marketing/consent overlays so they don't intercept pointer events in specs
// that never interact with them:
//   - `tip-cookie-consent` dismisses the cookie banner.
//   - `tiyp_popup_dismiss_until_v2_{en,kr}` keeps the full-screen welcome-offer
//     popup (fixed inset-0 z-[1000]) from opening ~400ms after load and eating
//     clicks. It stays hidden while `Date.now() <= <that value>`.
// Applied via storageState for the logged-out projects (playwright.config.ts)
// and injected before saving the authed storageState (global-setup.ts). The
// welcome-offer spec clears localStorage in its own beforeEach, so it still
// exercises the popup.
const FAR_FUTURE_MS = 32503680000000; // ~year 3000

export const E2E_SEED_LOCAL_STORAGE: { name: string; value: string }[] = [
  {
    name: 'tip-cookie-consent',
    value: JSON.stringify({
      analytics: true,
      marketing: true,
      timestamp: '2026-01-01T00:00:00Z',
    }),
  },
  { name: 'tiyp_popup_dismiss_until_v2_en', value: String(FAR_FUTURE_MS) },
  { name: 'tiyp_popup_dismiss_until_v2_kr', value: String(FAR_FUTURE_MS) },
];
