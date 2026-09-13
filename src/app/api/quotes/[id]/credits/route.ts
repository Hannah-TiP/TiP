import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { languageHeader } from '@/lib/proxy-language';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

// SMA-329 points application — partial wallet spend replaced the per-credit
// picker, so the path no longer carries a {credit_id} segment:
//   POST   /api/v2/quotes/{id}/credits  (optional body { points }; default = max)
//   DELETE /api/v2/quotes/{id}/credits
async function forward(
  request: NextRequest,
  method: 'POST' | 'DELETE',
  params: Promise<{ id: string }>,
) {
  const session = await auth();
  const accessToken = session?.accessToken;
  if (!accessToken) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const init: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...languageHeader(request),
    },
  };
  if (method === 'POST') {
    // Pass the caller's body through verbatim ({} or { points: n }).
    init.body = await request.text();
  }

  const response = await fetch(`${API_BASE_URL}/api/v2/quotes/${id}/credits`, init);

  const data = await response.json();

  if (!response.ok) {
    return NextResponse.json(
      { success: false, message: data.message || `Failed to ${method.toLowerCase()} points` },
      { status: response.status },
    );
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    return await forward(request, 'POST', params);
  } catch (error) {
    console.error('Apply points API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    return await forward(request, 'DELETE', params);
  } catch (error) {
    console.error('Remove points API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
