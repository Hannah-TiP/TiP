import { defineConfig } from '@playwright/test';
import path from 'node:path';

const AUTH_STATE_PATH = path.join(__dirname, 'e2e', '.auth', 'user.json');

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';

// Specs that require an authenticated session (run with stored storageState).
const AUTH_REQUIRED_SPECS = [
  '**/concierge-converse.spec.ts',
  '**/concierge-i18n-stepper.spec.ts',
  '**/concierge-screenshots.spec.ts',
  '**/concierge-request-human.spec.ts',
  '**/cancel-trip.spec.ts',
  '**/concierge-human-takeover.spec.ts',
  '**/concierge-responsive.spec.ts',
  '**/quotes.spec.ts',
  '**/checkout.spec.ts',
  '**/search-prefill-concierge.spec.ts',
  '**/reviews.spec.ts',
  '**/sma-55-hotel-benefits.spec.ts',
  '**/redeem-code.spec.ts',
  '**/trip-credits.spec.ts',
  '**/promo-code-credit-history.spec.ts',
  '**/responsive-my-page.spec.ts',
  '**/trip-share.spec.ts',
  '**/destination-search.spec.ts',
  '**/change-password.spec.ts',
];

// Specs that deliberately test the cookie-consent banner from a blank state.
// They manage localStorage themselves so must NOT get pre-set consent.
const COOKIE_CONSENT_SPECS = ['**/cookie-consent.spec.ts'];

// Pre-accepted cookie consent injected into localStorage for all other specs
// so the fixed-position banner does not intercept pointer events. The origin
// must match the actual test target — Playwright only applies localStorage
// from the storage state to matching origins, so a hardcoded localhost origin
// is silently ignored when running against a deployed URL.
const COOKIE_CONSENT_STATE = {
  cookies: [] as {
    name: string;
    value: string;
    domain: string;
    path: string;
    expires: number;
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'Strict' | 'Lax' | 'None';
  }[],
  origins: [
    {
      origin: new URL(BASE_URL).origin,
      localStorage: [
        {
          name: 'tip-cookie-consent',
          value: JSON.stringify({
            analytics: true,
            marketing: true,
            timestamp: '2026-01-01T00:00:00Z',
          }),
        },
      ],
    },
  ],
};

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 1,
  globalSetup: require.resolve('./e2e/global-setup.ts'),
  use: {
    baseURL: BASE_URL,
    headless: true,
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      testIgnore: [...AUTH_REQUIRED_SPECS, ...COOKIE_CONSENT_SPECS],
      use: { browserName: 'chromium', storageState: COOKIE_CONSENT_STATE },
    },
    {
      name: 'chromium-authed',
      testMatch: AUTH_REQUIRED_SPECS,
      use: {
        browserName: 'chromium',
        storageState: AUTH_STATE_PATH,
      },
    },
    {
      name: 'chromium-cookie-consent',
      testMatch: COOKIE_CONSENT_SPECS,
      use: { browserName: 'chromium' },
    },
  ],
  // Start local server when not testing against a deployed URL
  // Uses production build (npm start) if .next/ exists, otherwise dev server
  ...(!process.env.E2E_BASE_URL && {
    webServer: {
      command: process.env.CI_MODE ? 'node scripts/start-standalone.mjs' : 'npm run dev',
      port: 3000,
      reuseExistingServer: true,
      timeout: 60_000,
    },
  }),
});
