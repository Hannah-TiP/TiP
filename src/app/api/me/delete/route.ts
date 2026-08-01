import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

// Self-service account deletion (SMA-187/188). Forwards the re-auth payload
// to the v2 deletion endpoint; the `language` query param is passed through
// as the backend `Language` header so failure messages (wrong password,
// invalid code, already purged) come back localized.
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const accessToken = session?.accessToken;

    if (!accessToken) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const language = request.nextUrl.searchParams.get('language') || 'en';

    const response = await fetch(`${API_BASE_URL}/api/v2/auth/me/delete`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Language: language,
      },
      body: JSON.stringify({
        password: body.password,
        verification_code: body.verification_code,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data.message || 'Failed to delete account' },
        { status: response.status },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Account deletion POST API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
