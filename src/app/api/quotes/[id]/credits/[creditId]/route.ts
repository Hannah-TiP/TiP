import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

async function forward(
  method: 'POST' | 'DELETE',
  params: Promise<{ id: string; creditId: string }>,
) {
  const session = await auth();
  const accessToken = session?.accessToken;
  if (!accessToken) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { id, creditId } = await params;

  const response = await fetch(`${API_BASE_URL}/api/v2/quotes/${id}/credits/${creditId}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    return NextResponse.json(
      { success: false, message: data.message || `Failed to ${method.toLowerCase()} credit` },
      { status: response.status },
    );
  }

  return NextResponse.json(data);
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; creditId: string }> },
) {
  try {
    return await forward('POST', params);
  } catch (error) {
    console.error('Apply credit API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; creditId: string }> },
) {
  try {
    return await forward('DELETE', params);
  } catch (error) {
    console.error('Remove credit API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
