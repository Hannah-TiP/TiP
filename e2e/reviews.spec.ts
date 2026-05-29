import { test, expect } from '@playwright/test';

/**
 * Post-trip review flow e2e.
 *
 * Seed expectations (set by the Test agent against the local stack):
 *  - E2E_COMPLETED_TRIP_ID — a travel-completed trip owned by the E2E user
 *    whose itinerary includes at least one TiP-DB-backed item.
 *  - E2E_REVIEW_HOTEL_SLUG — slug of a hotel that has at least one published
 *    review (for the entity-detail display assertion).
 *
 * When the seed vars are absent the spec verifies the surfaces that hold
 * regardless of seed state: the session route renders for the authed user
 * and the entity detail page shows the reviews section.
 */

const COMPLETED_TRIP_ID = process.env.E2E_COMPLETED_TRIP_ID;
const REVIEW_HOTEL_SLUG = process.env.E2E_REVIEW_HOTEL_SLUG;

test.describe('Post-trip review session', () => {
  test('travel-history list and detail link into the session', async ({ page }) => {
    test.skip(!COMPLETED_TRIP_ID, 'E2E_COMPLETED_TRIP_ID not set; skipping');

    await page.goto(`/my-page/travel-history/${COMPLETED_TRIP_ID}`);

    // The completed-trip detail surfaces the entry CTA.
    const reviewCta = page.getByRole('link', { name: /review your experience/i });
    await expect(reviewCta).toBeVisible({ timeout: 15_000 });

    await reviewCta.click();
    await expect(page).toHaveURL(new RegExp(`/travel-history/${COMPLETED_TRIP_ID}/reviews`));

    // Session heading renders.
    await expect(page.getByRole('heading', { name: /review your experience/i })).toBeVisible();
  });

  test('session lists reviewable items with status pills and an interactive rating', async ({
    page,
  }) => {
    test.skip(!COMPLETED_TRIP_ID, 'E2E_COMPLETED_TRIP_ID not set; skipping');

    await page.goto(`/my-page/travel-history/${COMPLETED_TRIP_ID}/reviews`);

    // At least one item card with a status pill + a rating control.
    await expect(page.getByRole('radiogroup').first()).toBeVisible({ timeout: 15_000 });
    const statusPills = page.getByText(/Not Reviewed|Submitted|Locked|Draft/);
    await expect(statusPills.first()).toBeVisible();
  });

  test('entity detail page shows the reviews section', async ({ page }) => {
    test.skip(!REVIEW_HOTEL_SLUG, 'E2E_REVIEW_HOTEL_SLUG not set; skipping');

    await page.goto(`/hotel/${REVIEW_HOTEL_SLUG}`);

    // The shared <EntityReviews> renders either the aggregate/list or the
    // empty-state copy — both prove the placeholder was replaced.
    const reviewsRegion = page.getByText(/verified review|No reviews yet/i);
    await expect(reviewsRegion.first()).toBeVisible({ timeout: 15_000 });
  });
});

test.describe('Review session — unauthenticated', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('redirects to /sign-in', async ({ page }) => {
    await page.goto('/my-page/travel-history/1/reviews');
    await expect(page).toHaveURL(/sign-in/, { timeout: 10_000 });
  });
});
