import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, verification_code, first_name, last_name } = body;

    const response = await fetch(`${API_BASE_URL}/api/v2/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Language: 'en',
      },
      body: JSON.stringify({
        email,
        password,
        verification_code,
        first_name,
        last_name,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { message: error.detail || 'Registration failed' },
        { status: response.status },
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
