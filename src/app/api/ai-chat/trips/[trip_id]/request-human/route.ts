import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

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

    const language = request.headers.get('Language') || 'en';

    const response = await fetch(`${API_BASE_URL}/api/v2/ai-chat/trips/${trip_id}/request-human`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Language: language,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data.message || 'Failed to request human concierge' },
        { status: response.status },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Request human concierge error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
