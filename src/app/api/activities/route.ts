import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const backendSearchParams = new URLSearchParams();
    const cityId = searchParams.get('city_id');
    const category = searchParams.get('category');
    const language = searchParams.get('language') || 'en';

    if (cityId) backendSearchParams.set('city_id', cityId);
    if (category) backendSearchParams.set('category', category);

    const query = backendSearchParams.toString();
    const backendUrl = `${API_BASE_URL}/api/v2/activities${query ? `?${query}` : ''}`;

    const response = await fetch(backendUrl, {
      headers: {
        'Content-Type': 'application/json',
        lang: language,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'Failed to fetch activities',
      }));
      return NextResponse.json(
        { message: error.message || 'Failed to fetch activities' },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Activities API error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
