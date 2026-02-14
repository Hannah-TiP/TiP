import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language') || 'en';

    const response = await fetch(
      `${API_BASE_URL}/api/v1/hotel/hotels/recommend?language=${language}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'Language': language,
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { message: 'Failed to fetch recommended hotels' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Recommended hotels API error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
