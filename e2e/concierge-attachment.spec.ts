import { test, expect, type Page } from '@playwright/test';
import { gotoPage } from './support/navigation';

/**
 * Customer chat attachments (SMA-647) — fully route-stubbed: concierge
 * session/trip/history, attachment presign + finalize, the direct S3 POST and
 * the message send. Runs in the chromium-authed project like the other
 * concierge specs (/concierge is auth-gated by middleware). Route globs are
 * `*`-suffixed because globs match the full URL including `?language=`.
 */

const TRIP_ID = 9647;
const UPLOAD_URL = 'https://s3-stub.local/upload';

const session = {
  id: 647,
  user_id: 1,
  trip_id: TRIP_ID,
  status: 'ai',
  last_message_at: new Date().toISOString(),
};
const trip = { id: TRIP_ID, user_id: 1, status: 'draft', current_trip_version_id: 1 };
const tripVersion = {
  id: 1,
  trip_id: TRIP_ID,
  title: 'Attachment Trip',
  start_date: null,
  end_date: null,
  adults: 0,
  kids: 0,
  plan: [],
};
// A real 1×1 PNG so the composer's object-URL thumbnail actually decodes.
const PNG_BYTES = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);
const PNG_FILE = { name: 'villa.png', mimeType: 'image/png', buffer: PNG_BYTES };
const FINALIZED = {
  file: 'chat/attachments/1/villa.png',
  file_name: 'villa.png',
  content_type: 'image/png',
  size_bytes: PNG_BYTES.length,
};

function json(data: unknown, status = 200) {
  return {
    status,
    contentType: 'application/json',
    body: JSON.stringify(status < 300 ? { code: 200, message: 'Success', data } : data),
  };
}

async function stubConcierge(page: Page) {
  await page.route('**/api/ai-chat/sessions*', (route) => route.fulfill(json([{ session, trip }])));
  await page.route(`**/api/trip/${TRIP_ID}*`, (route) =>
    route.fulfill(json({ trip, active_quote: null })),
  );
  await page.route(`**/api/trip/${TRIP_ID}/current-version*`, (route) =>
    route.fulfill(json(tripVersion)),
  );
  await page.route(`**/api/ai-chat/trips/${TRIP_ID}/attachments/upload-credentials*`, (route) =>
    route.fulfill(
      json({
        upload_url: UPLOAD_URL,
        form_data: { key: 'chat/uploads/1/tmp.png', 'Content-Type': 'image/png' },
        upload_key: 'chat/uploads/1/tmp.png',
        bucket: 'tip-s3-bucket',
        region: 'us-west-1',
        restrictions: {
          max_file_size_bytes: 20971520,
          allowed_content_types: ['image/jpeg', 'image/png', 'application/pdf'],
          expiry_minutes: 15,
        },
      }),
    ),
  );
  await page.route(`${UPLOAD_URL}*`, (route) =>
    route.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': '*' }, body: '' }),
  );
}

/** Messages: empty history on GET; POST captured and echoed as the user row. */
async function stubMessages(page: Page, sent: Record<string, unknown>[]) {
  await page.route(`**/api/ai-chat/trips/${TRIP_ID}/messages*`, (route) => {
    if (route.request().method() !== 'POST') return route.fulfill(json([]));
    const body = route.request().postDataJSON() as Record<string, unknown>;
    sent.push(body);
    return route.fulfill(
      json({
        user_message: {
          id: 5001,
          user_id: 1,
          trip_id: TRIP_ID,
          role: 'user',
          message_type: body.message_type,
          content: body.content,
          attachment: body.attachment,
          sent_at: new Date().toISOString(),
        },
        assistant_message: null,
        trip: null,
        trip_version: null,
        field_updated: [],
      }),
    );
  });
}

test.describe('Concierge chat attachments (SMA-647)', () => {
  test('pick an image, send it with a caption, and see it in the user bubble', async ({ page }) => {
    await stubConcierge(page);
    await page.route(`**/api/ai-chat/trips/${TRIP_ID}/attachments/finalize*`, (route) =>
      route.fulfill(json(FINALIZED)),
    );
    const sent: Record<string, unknown>[] = [];
    await stubMessages(page, sent);

    await gotoPage(page, '/concierge');
    await page.getByTestId('attachment-input').setInputFiles(PNG_FILE);

    const chip = page.getByTestId('attachment-chip');
    await expect(chip).toBeVisible();
    await expect(chip).toContainText('villa.png');
    await expect(page.getByTestId('attachment-chip-thumbnail')).toBeVisible();

    await page.getByPlaceholder('Add a message (optional)').fill('Our villa view');
    await page.getByRole('button', { name: 'Send', exact: true }).click();

    const bubble = page.getByTestId('message-user-attachment');
    await expect(bubble).toBeVisible({ timeout: 10000 });
    await expect(bubble.getByTestId('message-attachment-image')).toBeVisible();
    await expect(bubble.getByTestId('attachment-caption')).toHaveText('Our villa view');
    await expect(chip).toHaveCount(0);

    expect(sent).toHaveLength(1);
    expect(sent[0].message_type).toBe('attachment');
    expect(sent[0].content).toBe('Our villa view');
    expect(sent[0].attachment).toEqual(FINALIZED);
  });

  test('a finalize rejection shows the backend message and keeps the file + caption', async ({
    page,
  }) => {
    await stubConcierge(page);
    await page.route(`**/api/ai-chat/trips/${TRIP_ID}/attachments/finalize*`, (route) =>
      route.fulfill(json({ code: 4220, message: 'This file could not be processed.' }, 422)),
    );
    const sent: Record<string, unknown>[] = [];
    await stubMessages(page, sent);

    await gotoPage(page, '/concierge');
    await page.getByTestId('attachment-input').setInputFiles(PNG_FILE);
    await page.getByPlaceholder('Add a message (optional)').fill('Our villa view');
    await page.getByRole('button', { name: 'Send', exact: true }).click();

    await expect(page.getByTestId('attachment-error')).toHaveText(
      'This file could not be processed.',
    );
    await expect(page.getByTestId('attachment-chip')).toContainText('villa.png');
    await expect(page.getByPlaceholder('Add a message (optional)')).toHaveValue('Our villa view');
    expect(sent).toHaveLength(0);
  });

  test('rejects an unsupported file type before uploading', async ({ page }) => {
    await stubConcierge(page);
    await stubMessages(page, []);
    let presigned = false;
    await page.route(`**/api/ai-chat/trips/${TRIP_ID}/attachments/upload-credentials*`, (route) => {
      presigned = true;
      return route.fallback();
    });

    await gotoPage(page, '/concierge');
    await page.getByTestId('attachment-input').setInputFiles({
      name: 'notes.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('hello'),
    });

    await expect(page.getByTestId('attachment-error')).toHaveText(
      'You can attach a JPEG, PNG, WebP or HEIC photo, or a PDF.',
    );
    await expect(page.getByTestId('attachment-chip')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Send', exact: true })).toBeDisabled();
    expect(presigned).toBe(false);
  });
});
