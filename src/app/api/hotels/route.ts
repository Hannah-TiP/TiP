import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const backendSearchParams = new URLSearchParams();

    const cityId = searchParams.get('city_id');
    const includeDraft = searchParams.get('include_draft');

    if (cityId) backendSearchParams.set('city_id', cityId);
    if (includeDraft === 'true') backendSearchParams.set('include_draft', 'true');

    const query = backendSearchParams.toString();
    const backendUrl = `${API_BASE_URL}/api/v2/hotels${query ? `?${query}` : ''}`;

    const response = await fetch(backendUrl, {
      headers: {
        'Content-Type': 'application/json',
        lang: searchParams.get('language') || 'en',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'Failed to fetch hotels',
      }));
      return NextResponse.json(
        { message: error.message || 'Failed to fetch hotels' },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Hotels API error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
