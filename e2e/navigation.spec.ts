import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';

// Stored auth state produced by global-setup (signs in the seeded
// test@test.com user). The SubNav only renders for an *authenticated*
// /my-page/** view — unauthenticated, the page-level guard redirects to
// /sign-in (variant 'none', no header/SubNav) before the client Header
// ever mounts.
const AUTH_STATE_PATH = path.join(__dirname, '.auth', 'user.json');

test.describe('Page navigation', () => {
  test('dream-hotels page loads', async ({ page }) => {
    await page.goto('/dream-hotels');
    await expect(page).toHaveURL(/dream-hotels/);
  });

  test('sign-in page loads', async ({ page }) => {
    await page.goto('/sign-in');
    await expect(page).toHaveURL(/sign-in/);
  });

  test('register page loads', async ({ page }) => {
    await page.goto('/register');
    await expect(page).toHaveURL(/register/);
  });

  test('about page loads', async ({ page }) => {
    await page.goto('/about');
    await expect(page).toHaveURL(/about/);
  });
});

test.describe('Centralized header — variants & active state', () => {
  test('marketing page (/dream-hotels) shows the overlay header over the hero', async ({
    page,
  }) => {
    await page.goto('/dream-hotels');
    // Exactly one centralized <header> on the page (no per-page TopBar).
    await expect(page.locator('header')).toHaveCount(1);
    const header = page.locator('header').first();
    await expect(header).toBeVisible();
    // overlay variant: transparent, absolutely positioned over the hero
    await expect(header).toHaveClass(/bg-transparent/);
    await expect(header).toHaveClass(/absolute/);
    // primary nav links present once *in the header* (the Footer also has
    // an "Explore" column with a "Dream Hotels" link, which Playwright's
    // case-insensitive substring name match would otherwise count too —
    // scope to the header to assert the centralized nav, not the footer).
    await expect(header.getByRole('link', { name: 'DREAM HOTELS', exact: true })).toHaveCount(1);
    await expect(header.getByRole('link', { name: 'MORE DREAMS', exact: true })).toHaveCount(1);
    // no SubNav on a marketing page
    await expect(page.getByRole('link', { name: 'Upcoming Travels' })).toHaveCount(0);
  });

  test('app page (/about) shows the standard light header bar', async ({ page }) => {
    await page.goto('/about');
    // Exactly one centralized <header> on the page (no per-page TopBar).
    await expect(page.locator('header')).toHaveCount(1);
    const header = page.locator('header').first();
    await expect(header).toBeVisible();
    await expect(header).toHaveClass(/bg-white/);
    await expect(header).not.toHaveClass(/bg-transparent/);
    await expect(header.getByRole('link', { name: 'ABOUT', exact: true })).toHaveCount(1);
    await expect(page.getByRole('link', { name: 'Upcoming Travels' })).toHaveCount(0);
  });

  test('magazine is reachable from the header nav and highlights on /magazine', async ({
    page,
  }) => {
    await page.goto('/about');
    const header = page.locator('header').first();
    const magazineLink = header.getByRole('link', { name: 'MAGAZINE', exact: true });
    await expect(magazineLink).toHaveCount(1);
    await expect(magazineLink).toHaveAttribute('href', '/magazine');

    await magazineLink.click();
    await expect(page).toHaveURL(/\/magazine$/);
    // app variant (not overlay) — standard light bar, no overlay treatment.
    await expect(header).toHaveClass(/bg-white/);
    await expect(header).not.toHaveClass(/bg-transparent/);
    // Active-nav highlight on the Magazine link.
    await expect(header.getByRole('link', { name: 'MAGAZINE', exact: true })).toHaveClass(
      /text-green-dark/,
    );
  });

  test.describe('authenticated SubNav', () => {
    // The Header is a client component; the SubNav for /my-page/** only
    // appears once it hydrates *and* the session is authenticated (otherwise
    // the page redirects to /sign-in). Run this case with the stored auth
    // state so we land on, and stay on, /my-page/credits.
    test.skip(
      !fs.existsSync(AUTH_STATE_PATH),
      'auth storage state not found (global-setup did not run); skipping authed SubNav check',
    );
    test.use({ storageState: AUTH_STATE_PATH });

    test('my-page subsection renders the SubNav with the active tab', async ({ page }) => {
      await page.goto('/my-page/credits');
      await expect(page).toHaveURL(/\/my-page\/credits/);
      const subnav = page.locator('nav', { hasText: 'Upcoming Travels' }).last();
      await expect(subnav.getByRole('link', { name: 'Credits', exact: true })).toBeVisible();
      await expect(
        subnav.getByRole('link', { name: 'Upcoming Travels', exact: true }),
      ).toBeVisible();
      await expect(subnav.getByRole('link', { name: 'Membership', exact: true })).toBeVisible();
      await expect(subnav.getByRole('link', { name: 'Travel History', exact: true })).toBeVisible();
    });
  });

  test('auth page (/sign-in) renders NO header at all', async ({ page }) => {
    await page.goto('/sign-in');
    await expect(page).toHaveURL(/sign-in/);
    await expect(page.locator('header')).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'DREAM HOTELS' })).toHaveCount(0);
  });

  // Regression guard for bXg8zTMG / PR #58: the centralized-header refactor
  // once dropped /concierge's viewport-bounded height, producing a page-level
  // scrollbar and breaking the internal chat scroll (fixed via the concierge
  // root's `h-[calc(100vh-3.5rem-1px)]`). This asserts the BEHAVIOR (no
  // document-level scroll) rather than the className, so it survives a
  // refactor that keeps the outcome but changes the implementation.
  test.describe('concierge viewport-bounded height (no page scrollbar)', () => {
    // /concierge is auth-gated: src/app/concierge/page.tsx returns null when
    // `!isAuthenticated`, so without the stored session the page renders
    // nothing (or redirects) and the no-scroll assertion would pass trivially
    // against the wrong surface. Reuse the same global-setup auth state +
    // skip-guard the authed SubNav case uses — do NOT hand-roll a login.
    const TRIP_ID = 9997;
    const SESSION_UUID = 'sess-uuid-scroll-guard';
    const session = {
      id: 1,
      user_id: 1,
      trip_id: TRIP_ID,
      status: 'ai',
      session_id: SESSION_UUID,
      schema_version: 1,
      last_message_at: new Date().toISOString(),
    };
    const trip = { id: TRIP_ID, status: 'draft', current_trip_version_id: 1 };
    const tripVersion = {
      id: 1,
      trip_id: TRIP_ID,
      title: 'Paris Trip',
      start_date: null,
      end_date: null,
      adults: 0,
      kids: 0,
      plan: [],
    };
    // A long conversation is what makes the regression observable: with the
    // pre-fix root the un-bounded chat column grows past the viewport and the
    // *document* scrolls (the inner MessageList `overflow-y-auto` never
    // engages). With the fixed `h-[calc(100vh-3.5rem-1px)]` root the column
    // is viewport-bounded so MessageList scrolls internally and the document
    // does not. An empty chat cannot reproduce it (nothing to overflow).
    const conversation = Array.from({ length: 40 }, (_, i) => ({
      id: i + 1,
      user_id: 1,
      trip_id: TRIP_ID,
      role: i % 2 === 0 ? 'user' : 'assistant',
      message_type: 'text',
      content: `Message ${i + 1}. ` + 'The quick brown fox jumps over the lazy dog. '.repeat(8),
      widgets: [],
    }));

    test.skip(
      !fs.existsSync(AUTH_STATE_PATH),
      'auth storage state not found (global-setup did not run); skipping concierge scroll guard',
    );
    test.use({ storageState: AUTH_STATE_PATH });

    test('/concierge fits the viewport with one header and visible chat content', async ({
      page,
      context,
    }) => {
      // Mock only the chat/trip bootstrap surface so the chat content area
      // renders deterministically against the local stack regardless of the
      // seeded backend state — the assertion is about layout, not data.
      await context.route('**/api/ai-chat/sessions', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: [{ session, trip }] }),
        }),
      );
      await context.route(`**/api/trip/${TRIP_ID}`, (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          // GET /trip/{id} returns the TripWithActiveQuote bundle now, not bare Trip.
          body: JSON.stringify({ data: { trip, active_quote: null } }),
        }),
      );
      await context.route(`**/api/trip/${TRIP_ID}/current-version`, (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: tripVersion }),
        }),
      );
      await context.route(`**/api/ai-chat/trips/${TRIP_ID}/messages`, (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: conversation }),
        }),
      );

      await page.goto('/concierge');

      // The chat input only renders once the page has authed, bootstrapped,
      // and laid out the chat area — so its visibility proves we are NOT on
      // a loading spinner, an error page, /sign-in, or a 0-height shell that
      // could make the no-scroll assertion pass for the wrong reason.
      const chatInput = page.getByPlaceholder(/ask your concierge/i);
      await expect(chatInput).toBeVisible({ timeout: 15_000 });

      // The seeded conversation must have rendered into the chat area — this
      // is the content that overflows the document under the regression.
      await expect(page.getByText('Message 1.', { exact: false }).first()).toBeVisible();

      // Exactly one centralized <header> (the bXg8zTMG invariant).
      await expect(page.locator('header')).toHaveCount(1);
      await expect(page.locator('header').first()).toBeVisible();

      // BEHAVIORAL assertion: the document does not scroll even with a long
      // conversation rendered. The +2 tolerates sub-pixel / border rounding
      // (the concierge root subtracts a 1px header border). The bXg8zTMG
      // regression makes the chat column grow past the viewport so
      // scrollHeight far exceeds clientHeight and this fails.
      const overflow = await page.evaluate(() => {
        const el = document.documentElement;
        return {
          scrollHeight: el.scrollHeight,
          clientHeight: el.clientHeight,
        };
      });
      expect(overflow.scrollHeight).toBeLessThanOrEqual(overflow.clientHeight + 2);
    });
  });
});
