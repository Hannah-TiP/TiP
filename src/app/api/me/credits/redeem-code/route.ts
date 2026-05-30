import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const accessToken = session?.accessToken;

    if (!accessToken) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const response = await fetch(`${API_BASE_URL}/api/v2/me/credits/redeem-code`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: body.code }),
    });

    const data = await response.json();

    // Preserve the backend status + envelope (including the distinct `code`)
    // so the client can map it to a localized error message.
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Redeem promo code API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
