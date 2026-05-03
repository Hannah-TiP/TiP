import { defineConfig } from '@playwright/test';
import path from 'node:path';

const AUTH_STATE_PATH = path.join(__dirname, 'e2e', '.auth', 'user.json');

// Specs that require an authenticated session (run with stored storageState).
const AUTH_REQUIRED_SPECS = [
  '**/concierge-converse.spec.ts',
  '**/concierge-screenshots.spec.ts',
  '**/cancel-trip.spec.ts',
  '**/concierge-human-takeover.spec.ts',
  '**/quotes.spec.ts',
  '**/checkout.spec.ts',
];

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 1,
  globalSetup: require.resolve('./e2e/global-setup.ts'),
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    headless: true,
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      testIgnore: AUTH_REQUIRED_SPECS,
      use: { browserName: 'chromium' },
    },
    {
      name: 'chromium-authed',
      testMatch: AUTH_REQUIRED_SPECS,
      use: {
        browserName: 'chromium',
        storageState: AUTH_STATE_PATH,
      },
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
