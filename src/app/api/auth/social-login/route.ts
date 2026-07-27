import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL;

export async function POST(request: NextRequest) {
  try {
    if (!API_BASE_URL) {
      return NextResponse.json({ message: 'API_BASE_URL is not configured' }, { status: 500 });
    }

    const body = await request.json();
    const { provider, auth_code, id_token, state } = body;
    const language = request.headers.get('Language') || 'en';

    const response = await fetch(`${API_BASE_URL}/api/v2/auth/social-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Language: language,
      },
      // auth_code is the OAuth auth-code redirect flow (Google SMA-133,
      // Kakao/Naver SMA-114); id_token is the legacy Google GIS credential —
      // the backend accepts either. `state` is forwarded for Naver, which
      // requires it echoed back in the token exchange.
      body: JSON.stringify({
        provider,
        ...(auth_code ? { auth_code } : {}),
        ...(id_token ? { id_token } : {}),
        ...(state ? { state } : {}),
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        { message: data?.message || data?.detail || 'Social login failed' },
        { status: response.status },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Social login proxy error:', error);
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 },
    );
  }
}
