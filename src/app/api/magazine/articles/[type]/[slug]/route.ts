import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

/**
 * Browser path for a magazine article detail. The `[type]` segment is the
 * SINGULAR backend enum (`destination|collection|guide|news|insider`) — the
 * caller (apiClient.getMagazineArticle) maps the plural URL segment before
 * calling. Forwards `?language=` as the backend `Language` header.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; slug: string }> },
) {
  try {
    const { type, slug } = await params;
    const language = new URL(request.url).searchParams.get('language') || 'en';

    const response = await fetch(
      `${API_BASE_URL}/api/v2/magazine/articles/${type}/${encodeURIComponent(slug)}`,
      {
        headers: {
          'Content-Type': 'application/json',
          Language: language,
        },
      },
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Article not found' }));
      return NextResponse.json(
        { message: error.message || 'Article not found' },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Magazine article detail API error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
