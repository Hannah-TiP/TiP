import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL;

// Public proxy (same posture as send-verification) — polled by the signup /
// forgot-password code screens while the user waits for their verification
// code. The backend reads the short-lived Redis flag the Brevo event webhook
// sets on blocked/hard_bounce.
export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email');
    if (!email) {
      // Internal-only error — the polling hook never surfaces this to the user.
      return NextResponse.json({ message: 'Missing email parameter' }, { status: 400 });
    }

    const response = await fetch(
      `${API_BASE_URL}/api/v2/auth/verification-delivery-status?email=${encodeURIComponent(email)}`,
      {
        headers: { Language: 'en' },
        cache: 'no-store',
      },
    );

    if (!response.ok) {
      // Internal-only error — the polling hook treats non-OK as "pending".
      return NextResponse.json(
        { message: 'Failed to fetch delivery status' },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data.data ?? { status: 'pending', reason_category: null });
  } catch {
    // Internal-only error — the polling hook treats this as "pending".
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
