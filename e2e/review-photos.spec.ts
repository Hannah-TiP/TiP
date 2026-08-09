import { test, expect, type Page, type Route } from '@playwright/test';
import { gotoPage } from './support/navigation';

/**
 * Review photo attach flow (SMA-280) — fully page.route-stubbed so it runs
 * without seed data. Runs in the chromium-authed project (the session page
 * lives under /my-page). NOTE: route globs match the FULL URL including the
 * query string — matchers are regexes anchored on the path.
 */

const TRIP_ID = 777;
const UPLOAD_URL = 'https://s3-stub.local/upload';
const FINALIZED_IMAGE = {
  original: 'reviews/media/9/photo-1.jpg',
  w128: 'reviews/media/9/photo-1_w128.jpg',
};

function envelope(data: unknown): string {
  return JSON.stringify({ code: 200, message: 'Success', data });
}

async function stubSessionPage(page: Page) {
  await page.route(new RegExp(`/api/trip/${TRIP_ID}(\\?|$)`), (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: envelope({
        trip: {
          id: TRIP_ID,
          user_id: 9,
          status: 'travel-completed',
          current_trip_version_id: 1,
          schema_version: 1,
        },
        active_quote: null,
      }),
    }),
  );
  await page.route(new RegExp(`/api/trip/${TRIP_ID}/current-version(\\?|$)`), (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: envelope({
        id: 1,
        trip_id: TRIP_ID,
        title: 'Tokyo Escape',
        start_date: '2026-07-01',
        end_date: '2026-07-05',
        adults: 2,
        kids: 0,
        schema_version: 1,
        plan: [
          {
            date: '2026-07-01',
            items: [{ item_type: 'hotel', hotel_id: 10, title: 'Aman Tokyo' }],
          },
        ],
      }),
    }),
  );
  await page.route(/\/api\/profile(\?|$)/, (route) => {
    if (route.request().method() !== 'GET') return route.fallback();
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: envelope({ id: 9, email: 'tester@example.com', travel_styles: [] }),
    });
  });
  await page.route(/\/api\/reviews\/by-entity\/hotel\/10(\?|$)/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: envelope({ reviews: [], aggregate: { average_rating: null, review_count: 0 } }),
    }),
  );
}

function stubCredentials(page: Page) {
  return page.route(/\/api\/reviews\/photo-upload-credentials(\?|$)/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: envelope({
        upload_url: UPLOAD_URL,
        form_data: { key: 'reviews/uploads/9/tmp.jpg', 'Content-Type': 'image/jpeg' },
        upload_key: 'reviews/uploads/9/tmp.jpg',
        bucket: 'tip-s3-bucket',
        region: 'us-west-1',
        restrictions: {
          max_file_size_bytes: 10485760,
          allowed_content_types: ['image/jpeg', 'image/png', 'image/heic'],
          expiry_minutes: 15,
        },
      }),
    }),
  );
}

function stubFinalize(page: Page) {
  return page.route(/\/api\/reviews\/photos\/finalize(\?|$)/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: envelope(FINALIZED_IMAGE),
    }),
  );
}

const JPEG_FILE = {
  name: 'holiday.jpg',
  mimeType: 'image/jpeg',
  buffer: Buffer.from('fake-jpeg-bytes'),
};

test.describe('Review photo attachments (SMA-280)', () => {
  test('attach a photo while writing a review and submit it with the review', async ({ page }) => {
    await stubSessionPage(page);
    await stubCredentials(page);
    await stubFinalize(page);
    await page.route(`${UPLOAD_URL}*`, (route) =>
      route.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': '*' }, body: '' }),
    );

    let createBody: { photos?: { original: string }[]; rating?: number } | null = null;
    await page.route(/\/api\/reviews(\?|$)/, (route: Route) => {
      if (route.request().method() !== 'POST') return route.fallback();
      createBody = route.request().postDataJSON();
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: envelope({
          review: {
            id: 1,
            author_user_id: 9,
            trip_id: TRIP_ID,
            entity_type: 'hotel',
            entity_id: 10,
            rating: 5,
            locked_at: null,
            deleted_at: null,
            comment: null,
            photos: [{ image: FINALIZED_IMAGE, hidden: false }],
            schema_version: 1,
            created_at: null,
            updated_at: null,
          },
          author: { id: 9, first_name: 'Test', last_name: 'User' },
        }),
      });
    });

    await gotoPage(page, `/my-page/travel-history/${TRIP_ID}/reviews`);

    // Rate the hotel so the item becomes submittable.
    await page.getByRole('radiogroup').getByRole('radio').nth(4).click();

    // Attach a photo through the (dynamically loaded) photo section.
    const input = page.getByTestId('review-photo-input');
    await expect(input).toBeAttached({ timeout: 15_000 });
    await input.setInputFiles(JPEG_FILE);

    // The finalized thumbnail appears; the pending tile clears.
    await expect(page.getByTestId('review-photo-thumb')).toHaveCount(1, { timeout: 15_000 });
    await expect(page.getByTestId('review-photo-uploading')).toHaveCount(0);

    await page.getByRole('button', { name: 'Submit Reviews', exact: true }).click();
    await expect(page.getByText(/submitted/i).first()).toBeVisible({ timeout: 15_000 });

    expect(createBody).not.toBeNull();
    expect(createBody!.photos).toEqual([expect.objectContaining(FINALIZED_IMAGE)]);
  });

  test('a failed upload can be retried without losing the written review text', async ({
    page,
  }) => {
    await stubSessionPage(page);
    await stubCredentials(page);
    await stubFinalize(page);

    let uploadAttempts = 0;
    await page.route(`${UPLOAD_URL}*`, (route) => {
      uploadAttempts += 1;
      if (uploadAttempts === 1) {
        return route.fulfill({
          status: 500,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: '',
        });
      }
      return route.fulfill({
        status: 204,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: '',
      });
    });

    await gotoPage(page, `/my-page/travel-history/${TRIP_ID}/reviews`);

    const comment = page.getByPlaceholder(/Share your experience/);
    await comment.fill('Unforgettable stay');

    const input = page.getByTestId('review-photo-input');
    await expect(input).toBeAttached({ timeout: 15_000 });
    await input.setInputFiles(JPEG_FILE);

    // Failure tile with a Retry affordance.
    await expect(page.getByTestId('review-photo-error')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Photo upload failed/)).toBeVisible();

    await page.getByRole('button', { name: 'Retry', exact: true }).click();
    await expect(page.getByTestId('review-photo-thumb')).toHaveCount(1, { timeout: 15_000 });

    // The written review text survived the failure + retry.
    await expect(comment).toHaveValue('Unforgettable stay');
    expect(uploadAttempts).toBe(2);
  });

  test('HEIC files are rejected client-side with a convert-to-JPEG message', async ({ page }) => {
    await stubSessionPage(page);
    let credentialRequests = 0;
    await page.route(/\/api\/reviews\/photo-upload-credentials(\?|$)/, (route) => {
      credentialRequests += 1;
      return route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
    });

    await gotoPage(page, `/my-page/travel-history/${TRIP_ID}/reviews`);

    const input = page.getByTestId('review-photo-input');
    await expect(input).toBeAttached({ timeout: 15_000 });
    await input.setInputFiles({
      name: 'IMG_0001.HEIC',
      mimeType: 'image/heic',
      buffer: Buffer.from('fake-heic-bytes'),
    });

    await expect(page.getByTestId('review-photo-error')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/convert to JPEG/)).toBeVisible();
    expect(credentialRequests).toBe(0);
  });
});
