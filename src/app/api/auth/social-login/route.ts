import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL;

export async function POST(request: NextRequest) {
  try {
    if (!API_BASE_URL) {
      return NextResponse.json({ message: 'API_BASE_URL is not configured' }, { status: 500 });
    }

    const body = await request.json();
    const { provider, id_token } = body;

    const response = await fetch(`${API_BASE_URL}/api/v2/auth/social-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Language: 'en',
      },
      body: JSON.stringify({ provider, id_token }),
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
