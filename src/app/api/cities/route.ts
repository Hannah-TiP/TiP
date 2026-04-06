import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Map frontend 'search' param to backend 'q' param
    const backendParams = new URLSearchParams(searchParams);
    const search = backendParams.get('search');
    if (search) {
      backendParams.set('q', search);
      backendParams.delete('search');
    }
    const backendUrl = `${API_BASE_URL}/api/v2/locations/cities?${backendParams.toString()}`;

    const response = await fetch(backendUrl, {
      headers: {
        'Content-Type': 'application/json',
        lang: searchParams.get('language') || 'en',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'Failed to fetch cities',
      }));
      return NextResponse.json(
        { message: error.message || 'Failed to fetch cities' },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Cities API error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
