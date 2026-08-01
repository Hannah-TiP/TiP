import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const backendSearchParams = new URLSearchParams();
    const cityId = searchParams.get('city_id');
    const language = searchParams.get('language') || 'en';
    const page = searchParams.get('page');
    const perPage = searchParams.get('per_page');
    // Free-text name search over journey titles AND city names (SMA-229).
    // Matching is language-independent server-side, so `q` is forwarded
    // untouched while the `lang` header still governs the display language.
    const q = searchParams.get('q');

    if (cityId) backendSearchParams.set('city_id', cityId);
    if (q) backendSearchParams.set('q', q);
    if (page) backendSearchParams.set('page', page);
    if (perPage) backendSearchParams.set('per_page', perPage);

    const query = backendSearchParams.toString();
    const backendUrl = `${API_BASE_URL}/api/v2/signature-journeys${query ? `?${query}` : ''}`;

    const response = await fetch(backendUrl, {
      headers: {
        'Content-Type': 'application/json',
        lang: language,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'Failed to fetch signature journeys',
      }));
      return NextResponse.json(
        { message: error.message || 'Failed to fetch signature journeys' },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Signature journeys API error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
