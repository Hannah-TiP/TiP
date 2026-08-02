import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

/**
 * Cities with at least one published local-experience activity or published
 * restaurant — the /more-dreams destination dropdown (SMA-247).
 */
export async function GET(request: NextRequest) {
  try {
    const language = new URL(request.url).searchParams.get('language') || 'en';

    const response = await fetch(`${API_BASE_URL}/api/v2/locations/destinations/experiences`, {
      headers: {
        'Content-Type': 'application/json',
        lang: language,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'Failed to fetch experience destinations',
      }));
      return NextResponse.json(
        { message: error.message || 'Failed to fetch experience destinations' },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Experience destinations API error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
