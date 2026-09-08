import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { languageHeader } from '@/lib/proxy-language';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    // The endpoint is PUBLIC, but with a bearer token the response also
    // carries a `resolved` block for the caller's own tier (SMA-322) — so
    // forward the token when a session exists.
    const session = await auth().catch(() => null);
    const accessToken = session?.accessToken;

    const response = await fetch(`${API_BASE_URL}/api/v2/benefits`, {
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...languageHeader(request),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data.message || 'Failed to fetch benefits' },
        { status: response.status },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Benefits GET API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
