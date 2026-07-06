import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

/**
 * Browser path for the published magazine article list (index page). Forwards
 * the facet filters (`type`, `country_id`, `city_id`, `brand_id`, `tag`),
 * pagination, and `?language=` as the backend `Language` header.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const backendSearchParams = new URLSearchParams();

    const forward = ['type', 'country_id', 'city_id', 'brand_id', 'tag', 'q', 'page', 'per_page'];
    for (const key of forward) {
      const value = searchParams.get(key);
      if (value) backendSearchParams.set(key, value);
    }

    const query = backendSearchParams.toString();
    const backendUrl = `${API_BASE_URL}/api/v2/magazine/articles${query ? `?${query}` : ''}`;

    const response = await fetch(backendUrl, {
      headers: {
        'Content-Type': 'application/json',
        Language: searchParams.get('language') || 'en',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to fetch articles' }));
      return NextResponse.json(
        { message: error.message || 'Failed to fetch articles' },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Magazine articles API error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
