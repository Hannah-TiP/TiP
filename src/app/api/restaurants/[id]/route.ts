import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const language = new URL(request.url).searchParams.get('language') || 'en';

    const response = await fetch(`${API_BASE_URL}/api/v2/restaurants/by-slug/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        lang: language,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'Restaurant not found',
      }));
      return NextResponse.json(
        { message: error.message || 'Restaurant not found' },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Restaurant detail API error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
