import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { languageHeader } from '@/lib/proxy-language';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

// SMA-896: concierge voice input. Forwards one recorded clip (multipart field
// `audio`) to the backend speech-to-text endpoint and returns `{ text }`.
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

    const incoming = await request.formData();
    const audio = incoming.get('audio');
    if (!(audio instanceof Blob)) {
      return NextResponse.json({ success: false, message: 'Missing audio' }, { status: 400 });
    }

    const body = new FormData();
    body.append('audio', audio, audio instanceof File ? audio.name : 'voice');

    // No Content-Type header: fetch sets the multipart boundary.
    const response = await fetch(`${API_BASE_URL}/api/v2/ai-chat/trips/${trip_id}/transcribe`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...languageHeader(request),
      },
      body,
    });

    const data = await response.json().catch(() => ({ success: false }));

    // Preserve the backend status + localized v2 `message`.
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Voice transcribe API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
