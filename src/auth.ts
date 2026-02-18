import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import type { JWT } from '@auth/core/jwt';
import type { User } from '@/types/auth';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Language': 'en' },
      body: JSON.stringify({
        refresh_token: token.refreshToken,
        device_id: token.deviceId,
      }),
    });
    if (!res.ok) throw new Error('Refresh failed');
    const { data } = await res.json();
    return {
      ...token,
      accessToken: data.access_token,
      accessTokenExpires: Date.now() + 29 * 60 * 1000,
      error: undefined,
    };
  } catch {
    return { ...token, error: 'RefreshAccessTokenError' };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
        device_id: {},
      },
      async authorize(credentials) {
        try {
          console.log('[Auth] authorize called for:', credentials.email);
          const loginRes = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Language': 'en' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
              device_id: credentials.device_id,
            }),
          });
          console.log('[Auth] login response status:', loginRes.status);
          if (!loginRes.ok) {
            const err = await loginRes.json().catch(() => ({}));
            console.error('[Auth] login failed:', err);
            return null;
          }
          const loginData = await loginRes.json();
          console.log('[Auth] login success, fetching /me');
          const { data } = loginData;

          const meRes = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
            headers: {
              'Authorization': `Bearer ${data.access_token}`,
              'Language': 'en',
            },
          });
          console.log('[Auth] /me response status:', meRes.status);
          if (!meRes.ok) {
            console.error('[Auth] /me failed');
            return null;
          }
          const { data: user } = await meRes.json();
          console.log('[Auth] authorize success for user id:', user.id);

          return {
            ...user,
            id: String(user.id),
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            deviceId: credentials.device_id,
          };
        } catch (e) {
          console.error('[Auth] authorize threw:', e);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async jwt({ token, user }: { token: JWT; user: any }) {
      if (user) {
        return {
          ...token,
          accessToken: user.accessToken as string,
          refreshToken: user.refreshToken as string,
          deviceId: user.deviceId as string,
          accessTokenExpires: Date.now() + 29 * 60 * 1000,
          user: {
            id: user.id as number,
            email: user.email as string,
            first_name: user.first_name as string | undefined,
            last_name: user.last_name as string | undefined,
            avatar: user.avatar as string | undefined,
            membership: user.membership as string | undefined,
            is_verified: user.is_verified as boolean,
          } satisfies User,
        } satisfies JWT;
      }
      if (Date.now() < token.accessTokenExpires) return token;
      return refreshAccessToken(token);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: { session: any; token: JWT }) {
      session.accessToken = token.accessToken;
      session.user = token.user;
      if (token.error) session.error = token.error;
      return session;
    },
  },
  pages: { signIn: '/sign-in' },
  session: { strategy: 'jwt' },
});
