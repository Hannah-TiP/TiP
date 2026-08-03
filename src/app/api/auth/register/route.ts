import { NextRequest, NextResponse } from 'next/server';
import { languageHeader } from '@/lib/proxy-language';

const API_BASE_URL = process.env.API_BASE_URL;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, verification_code, first_name, last_name, referral_code } = body;

    const response = await fetch(`${API_BASE_URL}/api/v2/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...languageHeader(request),
      },
      body: JSON.stringify({
        email,
        password,
        verification_code,
        first_name,
        last_name,
        // Unknown / invalid codes are silently ignored by the backend so it
        // never blocks registration — see tip-backend v2/services/user_auth.py.
        ...(referral_code ? { referral_code } : {}),
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      // The v2 backend error envelope carries `message` (never `detail`) —
      // surface it so users see the real reason, not the generic fallback.
      return NextResponse.json(
        { message: error.message || 'Registration failed' },
        { status: response.status },
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
