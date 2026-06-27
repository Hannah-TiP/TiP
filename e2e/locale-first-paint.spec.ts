import { test, expect } from '@playwright/test';

// SMA-180: first-visit language must be locale-aware with NO flash of the wrong
// language. A Korean-locale browser (Accept-Language: ko) must get the SSR
// first paint already in Korean; an English-locale browser gets English. There
// is no saved `tip-lang` preference in these tests, so only the Accept-Language
// header / navigator.language ladder is exercised.

test.describe('First-visit locale detection (SSR, no flash)', () => {
  test('Korean Accept-Language renders the SSR HTML in Korean', async ({ browser }) => {
    const context = await browser.newContext({
      locale: 'ko-KR',
      extraHTTPHeaders: { 'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8' },
    });
    const page = await context.newPage();

    const response = await page.goto('/');
    const html = await response!.text();

    // SSR first paint: the raw server HTML already carries the Korean copy and
    // <html lang="ko"> — proving the language was resolved server-side, not
    // corrected after hydration.
    expect(html).toContain('lang="ko"');
    expect(html).toContain('로그인');
    expect(html).not.toContain('>SIGN IN<');

    // And the hydrated page still shows Korean (no flash-back to English).
    await expect(
      page.getByTestId('desktop-nav').getByRole('link', { name: '로그인' }),
    ).toBeVisible();

    await context.close();
  });

  test('English Accept-Language renders the SSR HTML in English', async ({ browser }) => {
    const context = await browser.newContext({
      locale: 'en-US',
      extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' },
    });
    const page = await context.newPage();

    const response = await page.goto('/');
    const html = await response!.text();

    expect(html).toContain('lang="en"');
    expect(html).toContain('SIGN IN');

    await expect(
      page.getByTestId('desktop-nav').getByRole('link', { name: 'SIGN IN' }),
    ).toBeVisible();

    await context.close();
  });
});
