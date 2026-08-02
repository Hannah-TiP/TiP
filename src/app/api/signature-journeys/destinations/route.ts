import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

/**
 * Cities that have at least one PUBLISHED signature journey (SMA-247).
 *
 * NOTE: this static segment takes precedence over the sibling `[slug]` route,
 * so `destinations` is a RESERVED signature-journey slug.
 */
export async function GET(request: NextRequest) {
  try {
    const language = new URL(request.url).searchParams.get('language') || 'en';

    const response = await fetch(`${API_BASE_URL}/api/v2/signature-journeys/destinations`, {
      headers: {
        'Content-Type': 'application/json',
        lang: language,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'Failed to fetch signature journey destinations',
      }));
      return NextResponse.json(
        { message: error.message || 'Failed to fetch signature journey destinations' },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Signature journey destinations API error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
