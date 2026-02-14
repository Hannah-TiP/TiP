import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Forward all query params to backend
    const backendUrl = `${API_BASE_URL}/api/v1/hotel?${searchParams.toString()}`;

    const response = await fetch(backendUrl, {
      headers: {
        'Content-Type': 'application/json',
        'Language': searchParams.get('language') || 'en',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'Failed to fetch hotels'
      }));
      return NextResponse.json(
        { message: error.message || 'Failed to fetch hotels' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Hotels API error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
