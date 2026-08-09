import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { languageHeader } from '@/lib/proxy-language';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ entity_type: string; entity_id: string }> },
) {
  try {
    const { entity_type, entity_id } = await params;

    // The endpoint is PUBLIC, but it honors the auth header: the author's own
    // reviews come back with their photos populated (SMA-280) — so forward
    // the bearer token when a session exists.
    const session = await auth().catch(() => null);
    const accessToken = session?.accessToken;

    const response = await fetch(
      `${API_BASE_URL}/api/v2/reviews/by-entity/${entity_type}/${entity_id}`,
      {
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          ...languageHeader(request),
        },
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data.message || 'Failed to fetch reviews' },
        { status: response.status },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Reviews by-entity API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
