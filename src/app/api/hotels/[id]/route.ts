import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const response = await fetch(
      `${API_BASE_URL}/api/v1/hotel/${id}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'Language': 'en',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'Hotel not found'
      }));
      return NextResponse.json(
        { message: error.message || 'Hotel not found' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Hotel detail API error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
