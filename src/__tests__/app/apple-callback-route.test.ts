import { describe, expect, it } from 'vitest';
import { POST } from '@/app/auth/apple/callback/route';

/** Sign in with Apple's form_post return URL (SMA-720). */

function post(fields: Record<string, string>): Request {
  const body = new URLSearchParams(fields);
  return new Request('https://www.travelinyourpocket.com/auth/apple/callback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
}

function fragmentOf(response: Response): URLSearchParams {
  const location = response.headers.get('Location') ?? '';
  expect(location.startsWith('/auth/apple/complete#')).toBe(true);
  return new URLSearchParams(location.split('#')[1]);
}

describe('POST /auth/apple/callback', () => {
  it('hands id_token, state and the first-authorization name to the page in the fragment', async () => {
    const response = await POST(
      post({
        id_token: 'apple.jwt.token',
        code: 'c1',
        state: 'enc-state',
        user: JSON.stringify({
          name: { firstName: 'Hannah', lastName: 'Kim' },
          email: 'h@example.com',
        }),
      }),
    );
    expect(response.status).toBe(303);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    const fragment = fragmentOf(response);
    expect(Object.fromEntries(fragment)).toEqual({
      id_token: 'apple.jwt.token',
      first_name: 'Hannah',
      last_name: 'Kim',
      state: 'enc-state',
    });
  });

  it('omits the name on later sign-ins and survives a malformed user field', async () => {
    expect(Object.fromEntries(fragmentOf(await POST(post({ id_token: 't', state: 's' }))))).toEqual(
      {
        id_token: 't',
        state: 's',
      },
    );
    expect(
      Object.fromEntries(
        fragmentOf(await POST(post({ id_token: 't', state: 's', user: '{not json' }))),
      ),
    ).toEqual({ id_token: 't', state: 's' });
  });

  it('maps a cancelled authorization to access_denied, keeping state for the bounce-back', async () => {
    const fragment = fragmentOf(
      await POST(post({ error: 'user_cancelled_authorize', state: 's' })),
    );
    expect(Object.fromEntries(fragment)).toEqual({ error: 'access_denied', state: 's' });
  });

  it('reports a non-form body as invalid_request', async () => {
    const response = await POST(
      new Request('https://x.test/auth/apple/callback', { method: 'POST', body: '' }),
    );
    expect(fragmentOf(response).get('error')).toBe('invalid_request');
  });
});
