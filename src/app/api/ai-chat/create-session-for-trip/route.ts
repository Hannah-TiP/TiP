import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

interface V1Session {
  session_id?: string;
  trip_id?: number | null;
}

async function resolveSessionIdForTrip(
  accessToken: string,
  tripId: number,
): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/ai-chat/sessions`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) return null;
    const body = await res.json();
    const list: V1Session[] = body?.data || [];
    const found = list.find((s) => s.trip_id === tripId);
    return found?.session_id ?? null;
  } catch (err) {
    console.error('Failed to resolve session_id for trip:', err);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const accessToken = session?.accessToken;

    if (!accessToken) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));

    const response = await fetch(`${API_BASE_URL}/api/v2/ai-chat/sessions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ trip_id: body.trip_id }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data.message || 'Failed to create session for trip' },
        { status: response.status },
      );
    }

    if (data?.data && data.data.trip_id != null && !data.data.session_id) {
      data.data.session_id = await resolveSessionIdForTrip(accessToken, data.data.trip_id);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Create session for trip error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
