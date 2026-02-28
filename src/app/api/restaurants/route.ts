import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const backendUrl = `${API_BASE_URL}/api/v1/restaurant?${searchParams.toString()}`;

    const response = await fetch(backendUrl, {
      headers: {
        'Content-Type': 'application/json',
        'Language': searchParams.get('language') || 'en',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'Failed to fetch restaurants'
      }));
      return NextResponse.json(
        { message: error.message || 'Failed to fetch restaurants' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Restaurants API error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
