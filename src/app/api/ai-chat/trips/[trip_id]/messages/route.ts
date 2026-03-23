import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

export async function GET(_request: NextRequest, context: { params: Promise<unknown> }) {
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

    const response = await fetch(`${API_BASE_URL}/api/v2/ai-chat/trips/${trip_id}/messages`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data.message || 'Failed to fetch history' },
        { status: response.status },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Get history error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

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
    const { content, message_type = 'text', media_url, widget_response, sent_at } = body;

    const response = await fetch(`${API_BASE_URL}/api/v2/ai-chat/trips/${trip_id}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        message_type,
        media_url,
        widget_response,
        sent_at,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data.message || 'Failed to send message' },
        { status: response.status },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
