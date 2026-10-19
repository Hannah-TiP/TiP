import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { languageHeader } from '@/lib/proxy-language';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

// SMA-647: customer chat attachment finalize (temp S3 upload → permanent ChatAttachment).
export async function POST(request: NextRequest, context: { params: Promise<unknown> }) {
  try {
    const session = await auth();
    const accessToken = session?.accessToken;

    if (!accessToken) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { trip_id } = (await context.params) as { trip_id: string };

    if (!trip_id) {
      return NextResponse.json({ success: false, message: 'Missing trip_id' }, { status: 400 });
    }

    const body = await request.json();

    const response = await fetch(
      `${API_BASE_URL}/api/v2/ai-chat/trips/${trip_id}/attachments/finalize`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          ...languageHeader(request),
        },
        body: JSON.stringify(body),
      },
    );

    const data = await response.json();

    // Preserve the backend status + v2 envelope (`message`, business `code`)
    // so the client can surface the server's localized rejection.
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Chat attachment finalize API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
