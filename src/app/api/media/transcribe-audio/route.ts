import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const accessToken = session?.accessToken;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { session_id, media_url, duration, filename } = body;

    if (!session_id || !media_url) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const language = request.headers.get('language') || 'en';

    const response = await fetch(
      `${API_BASE_URL}/api/v1/media/transcribe-audio`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'language': language,
        },
        body: JSON.stringify({
          session_id,
          media_url,
          duration,
          filename,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data.message || 'Failed to transcribe audio' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error transcribing audio:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
