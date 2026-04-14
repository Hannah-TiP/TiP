import { NextResponse } from 'next/server';
import { auth } from '@/auth';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

interface V1Session {
  session_id?: string;
  trip_id?: number | null;
}

interface V2Session {
  trip_id?: number | null;
  session_id?: string | null;
  [key: string]: unknown;
}

async function fetchV1SessionMap(accessToken: string): Promise<Map<number, string>> {
  const map = new Map<number, string>();
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/ai-chat/sessions`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) return map;
    const body = await res.json();
    const list: V1Session[] = body?.data || [];
    for (const item of list) {
      if (item.trip_id != null && item.session_id) {
        map.set(item.trip_id, item.session_id);
      }
    }
  } catch (err) {
    console.error('Failed to fetch v1 sessions for enrichment:', err);
  }
  return map;
}

export async function GET() {
  try {
    const session = await auth();
    const accessToken = session?.accessToken;

    if (!accessToken) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const [v2Response, v1Map] = await Promise.all([
      fetch(`${API_BASE_URL}/api/v2/ai-chat/sessions`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }),
      fetchV1SessionMap(accessToken),
    ]);

    const data = await v2Response.json();

    if (!v2Response.ok) {
      return NextResponse.json(
        { success: false, message: data.message || 'Failed to list sessions' },
        { status: v2Response.status },
      );
    }

    if (Array.isArray(data?.data)) {
      data.data = (data.data as V2Session[]).map((session) => ({
        ...session,
        session_id:
          session.session_id ??
          (session.trip_id != null ? (v1Map.get(session.trip_id) ?? null) : null),
      }));
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('List sessions error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
