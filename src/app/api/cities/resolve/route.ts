import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { languageHeader } from '@/lib/proxy-language';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

// SMA-644 home-city picker: resolve a Google place_id to our city row
// (find-or-create, auth required).
//   POST /api/v2/locations/cities/resolve  body { place_id, session_token }
// `?language=` is forwarded (never invented) as both `lang` (content collapse)
// and `Language` (error-message i18n).
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const accessToken = session?.accessToken;
    if (!accessToken) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const language = new URL(request.url).searchParams.get('language');
    const response = await fetch(`${API_BASE_URL}/api/v2/locations/cities/resolve`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...(language ? { lang: language } : {}),
        ...languageHeader(request),
      },
      // Pass the caller's body through verbatim ({ place_id, session_token }).
      body: await request.text(),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data.message || 'Failed to resolve city' },
        { status: response.status },
      );
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error('City resolve API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
