import { chromium, request, FullConfig } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const E2E_EMAIL = process.env.E2E_USER_EMAIL || 'test@test.com';
const E2E_PASSWORD = process.env.E2E_USER_PASSWORD || 'testtest';

export const AUTH_STATE_PATH = path.join(__dirname, '.auth', 'user.json');

async function waitForServer(baseURL: string, timeoutMs = 60_000) {
  const req = await request.newContext();
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await req.get(`${baseURL}/api/health`);
      if (res.ok()) {
        await req.dispose();
        return;
      }
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  await req.dispose();
  throw new Error(`Frontend at ${baseURL} did not become ready within ${timeoutMs}ms`);
}

export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL || 'http://localhost:3000';

  fs.mkdirSync(path.dirname(AUTH_STATE_PATH), { recursive: true });

  await waitForServer(baseURL);

  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();

  await page.goto('/sign-in');
  await page.getByPlaceholder(/email/i).fill(E2E_EMAIL);
  await page.getByPlaceholder(/password/i).fill(E2E_PASSWORD);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.waitForURL(/\/my-page|\/onboarding/, { timeout: 30_000 });

  await context.storageState({ path: AUTH_STATE_PATH });
  await browser.close();
}
