import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const limit = searchParams.get('limit');

    if (!q) {
      return NextResponse.json({ message: 'Query parameter q is required' }, { status: 400 });
    }

    const backendParams = new URLSearchParams({ q });
    if (limit) backendParams.set('limit', limit);

    const backendUrl = `${API_BASE_URL}/api/v2/locations/destinations/search?${backendParams}`;

    const response = await fetch(backendUrl, {
      headers: {
        'Content-Type': 'application/json',
        lang: searchParams.get('language') || 'en',
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
