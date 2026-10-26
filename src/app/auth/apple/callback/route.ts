import { completionPath } from '@/lib/social-oauth';

/**
 * Sign in with Apple return URL (SMA-720). Apple `form_post`s here (it
 * requires that whenever name/email are requested) with `id_token`, `state`,
 * `code`, and — on the user's FIRST authorization only — `user`, a JSON
 * string carrying their name. An `error` (e.g. `user_cancelled_authorize`)
 * comes back the same way.
 *
 * Nothing is verified or stored here: the values ride to the client callback
 * page in the URL FRAGMENT (never sent to a server or logged), which checks
 * the CSRF nonce in sessionStorage and completes the sign-in like Kakao/Naver.
 * 303 turns the POST into a GET. The Location is relative so it stays on the
 * public origin behind the proxy.
 */
export async function POST(request: Request): Promise<Response> {
  const form = await request.formData().catch(() => null);
  const field = (name: string) => {
    const value = form?.get(name);
    return typeof value === 'string' ? value : '';
  };

  const fragment = new URLSearchParams();
  const error = field('error');
  if (error || !form) {
    fragment.set(
      'error',
      error === 'user_cancelled_authorize' ? 'access_denied' : error || 'invalid_request',
    );
  } else {
    fragment.set('id_token', field('id_token'));
    let first = '';
    let last = '';
    try {
      const user = JSON.parse(field('user') || '{}') as {
        name?: { firstName?: unknown; lastName?: unknown };
      };
      if (typeof user.name?.firstName === 'string') first = user.name.firstName;
      if (typeof user.name?.lastName === 'string') last = user.name.lastName;
    } catch {
      // A malformed `user` only loses the name; the sign-in still works.
    }
    if (first) fragment.set('first_name', first);
    if (last) fragment.set('last_name', last);
  }
  const state = field('state');
  if (state) fragment.set('state', state);

  return new Response(null, {
    status: 303,
    headers: {
      Location: `${completionPath('apple')}#${fragment.toString()}`,
      'Cache-Control': 'no-store',
      'Referrer-Policy': 'no-referrer',
    },
  });
}
