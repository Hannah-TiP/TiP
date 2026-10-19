import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { languageHeader } from '@/lib/proxy-language';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

// SMA-644 home-city picker: Google Places-backed suggestions (auth required).
//   GET /api/v2/locations/city-suggestions?q=&session_token=
// `?language=` is forwarded (never invented) as both `lang` (content collapse)
// and `Language` (error-message i18n).
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const accessToken = session?.accessToken;
    if (!accessToken) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const backendParams = new URLSearchParams();
    backendParams.set('q', searchParams.get('q') ?? '');
    const sessionToken = searchParams.get('session_token');
    if (sessionToken) backendParams.set('session_token', sessionToken);

    const language = searchParams.get('language');
    const response = await fetch(
      `${API_BASE_URL}/api/v2/locations/city-suggestions?${backendParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          ...(language ? { lang: language } : {}),
          ...languageHeader(request),
        },
      },
    );

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data.message || 'Failed to fetch city suggestions' },
        { status: response.status },
      );
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error('City suggestions API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
