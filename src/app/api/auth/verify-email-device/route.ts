import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, device_id, verification_code, code_type } = body;

    const response = await fetch(`${API_BASE_URL}/api/v1/auth/verify-email-device`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Language: 'en',
      },
      body: JSON.stringify({
        email,
        device_id,
        verification_code,
        code_type: code_type || 'register',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { message: error.detail || 'Verification failed' },
        { status: response.status },
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
