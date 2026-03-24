import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const response = await fetch(`${API_BASE_URL}/api/v2/locations/cities/${id}`, {
      headers: { 'Content-Type': 'application/json', lang: 'en' },
    });

    if (!response.ok) {
      return NextResponse.json({ message: 'City not found' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
