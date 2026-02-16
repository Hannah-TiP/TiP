import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_BASE_URL = process.env.API_BASE_URL;

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refresh_token')?.value;
    const deviceId = cookieStore.get('device_id')?.value;

    if (!refreshToken || !deviceId) {
      return NextResponse.json(
        { message: 'No refresh token' },
        { status: 401 }
      );
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Language': 'en',
      },
      body: JSON.stringify({ refresh_token: refreshToken, device_id: deviceId }),
    });

    if (!response.ok) {
      cookieStore.delete('access_token');
      cookieStore.delete('refresh_token');
      return NextResponse.json(
        { message: 'Token refresh failed' },
        { status: 401 }
      );
    }

    const responseData = await response.json();

    // Create response first
    const nextResponse = NextResponse.json({ success: true });

    // Set cookie on response
    nextResponse.cookies.set('access_token', responseData.data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 30,
      path: '/',
    });

    return nextResponse;
  } catch {
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
