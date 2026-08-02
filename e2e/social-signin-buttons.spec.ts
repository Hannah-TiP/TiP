import { test, expect } from '@playwright/test';
import { gotoPage } from './support/navigation';

/**
 * E2E: the Kakao + Naver social sign-in buttons (SMA-114).
 *
 * Kakao/Naver mirror the Google full-page redirect (auth-code) flow. These
 * tests assert the buttons render on the public auth pages and that a click
 * begins a top-level navigation toward the provider's authorize endpoint.
 *
 * The buttons are gated on their public client id/key
 * (NEXT_PUBLIC_KAKAO_REST_API_KEY / NEXT_PUBLIC_NAVER_CLIENT_ID) being
 * configured in the running environment — exactly like the Google button.
 * When a provider isn't configured in the test environment its block is
 * skipped rather than failing. The live OAuth round-trip itself can't be
 * automated (no real provider consoles) and is verified manually.
 *
 * Runs under the default `chromium` project (logged out) — middleware
 * bounces authenticated users off /sign-in and /register.
 */

const PROVIDERS = [
  { name: 'kakao', testId: 'kakao-signin-button', authHost: 'kauth.kakao.com' },
  { name: 'naver', testId: 'naver-signin-button', authHost: 'nid.naver.com' },
] as const;

for (const route of ['/sign-in', '/register']) {
  test.describe(`Social sign-in buttons on ${route}`, () => {
    for (const provider of PROVIDERS) {
      test(`${provider.name} button renders and click navigates toward the provider`, async ({
        page,
      }) => {
        await gotoPage(page, route);

        const button = page.getByTestId(provider.testId);
        if ((await button.count()) === 0) {
          test.skip(true, `${provider.name} not configured in this environment`);
          return;
        }

        await expect(button).toBeVisible();
        await expect(button.locator('svg')).toBeVisible();

        // Block the actual provider request so the test doesn't depend on the
        // external host; we only assert the navigation was started toward it.
        await page.route(`https://${provider.authHost}/**`, (r) => r.abort());

        const navigation = page
          .waitForRequest((req) => req.url().startsWith(`https://${provider.authHost}/`), {
            timeout: 5000,
          })
          .catch(() => null);

        await button.click();

        const request = await navigation;
        expect(request, `expected navigation toward ${provider.authHost}`).not.toBeNull();
        const url = new URL(request!.url());
        expect(url.searchParams.get('response_type')).toBe('code');
        expect(url.searchParams.get('redirect_uri')).toContain(`/auth/${provider.name}/callback`);
      });
    }
  });
}
