import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    // q is optional: a blank/omitted query returns the top bookable
    // destinations (the initial typeahead state).
    const q = searchParams.get('q');
    const limit = searchParams.get('limit');
    const language = searchParams.get('language') || 'en';

    const backendParams = new URLSearchParams();
    if (q) backendParams.set('q', q);
    if (limit) backendParams.set('limit', limit);
    backendParams.set('language', language);

    const backendUrl = `${API_BASE_URL}/api/v2/locations/destinations/search?${backendParams}`;

    const response = await fetch(backendUrl, {
      headers: {
        'Content-Type': 'application/json',
        lang: language,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'Failed to search destinations',
      }));
      return NextResponse.json(
        { message: error.message || 'Failed to search destinations' },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Destinations search API error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
