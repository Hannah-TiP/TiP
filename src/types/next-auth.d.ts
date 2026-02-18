import type { User } from './auth';

declare module 'next-auth' {
  interface Session {
    accessToken: string;
    error?: string;
    user: User;
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    accessToken: string;
    refreshToken: string;
    deviceId: string;
    accessTokenExpires: number;
    user: User;
    error?: string;
  }
}
