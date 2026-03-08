import { test, expect } from '@playwright/test';

test('health endpoint returns healthy', async ({ request }) => {
  const response = await request.get('/api/health');
  expect(response.ok()).toBeTruthy();

  const body = await response.json();
  expect(body.status).toBe('healthy');
  expect(body.service).toBe('tip-customer-frontend');
});
