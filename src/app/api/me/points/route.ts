import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { languageHeader } from '@/lib/proxy-language';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

// The member's TiP Points wallet (SMA-332): GET /api/v2/me/points → the
// backend-derived balance + full ledger. Language: forward, never invent —
// an explicit incoming `Language` header wins, else a caller-supplied
// `?language=`, else no header so the backend ladder resolves.
export async function GET(request: Request) {
  try {
    const session = await auth();
    const accessToken = session?.accessToken;

    if (!accessToken) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const incomingLanguage = request.headers.get('language');

    const response = await fetch(`${API_BASE_URL}/api/v2/me/points`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...languageHeader(request),
        ...(incomingLanguage ? { Language: incomingLanguage } : {}),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data.message || 'Failed to fetch points' },
        { status: response.status },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('My points GET API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
