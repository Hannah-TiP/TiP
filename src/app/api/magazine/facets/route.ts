import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

/**
 * Browser path for the magazine filter options (country/city/brand/tag among
 * published articles). The facet names are localized client-side from the
 * MultiLanguageString, so the backend `Language` header is not required — but
 * forward `?language=` when present for consistency.
 */
export async function GET(request: NextRequest) {
  try {
    const language = new URL(request.url).searchParams.get('language') || 'en';

    const response = await fetch(`${API_BASE_URL}/api/v2/magazine/facets`, {
      headers: {
        'Content-Type': 'application/json',
        Language: language,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to fetch facets' }));
      return NextResponse.json(
        { message: error.message || 'Failed to fetch facets' },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Magazine facets API error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
