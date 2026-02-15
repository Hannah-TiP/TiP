import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_BASE_URL = process.env.API_BASE_URL;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, verification_code, password, device_id } = body;

    const response = await fetch(`${API_BASE_URL}/api/v1/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Language': 'en',
      },
      body: JSON.stringify({ email, verification_code, password, device_id }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { message: error.detail || 'Password reset failed' },
        { status: response.status }
      );
    }

    const responseData = await response.json();
    const { access_token, refresh_token } = responseData.data;

    // Create response first
    const nextResponse = NextResponse.json({ success: true });

    // Set httpOnly cookies on the response for security
    nextResponse.cookies.set('access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 30,
      path: '/',
    });

    nextResponse.cookies.set('refresh_token', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return nextResponse;
  } catch (error) {
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
