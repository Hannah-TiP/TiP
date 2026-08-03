import { NextRequest, NextResponse } from 'next/server';
import { languageHeader } from '@/lib/proxy-language';

const API_BASE_URL = process.env.API_BASE_URL;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code_type } = body;

    const response = await fetch(`${API_BASE_URL}/api/v2/auth/send-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...languageHeader(request),
      },
      body: JSON.stringify({ email, code_type }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      // The v2 backend error envelope carries `message` (never `detail`) —
      // e.g. the resend-cooldown message must reach the user verbatim.
      return NextResponse.json(
        { message: error.message || 'Failed to send verification code' },
        { status: response.status },
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
