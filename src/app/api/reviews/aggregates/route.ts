import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entity_type');
    const entityIds = searchParams.get('entity_ids');

    if (!entityType || !entityIds) {
      return NextResponse.json(
        { success: false, message: 'entity_type and entity_ids are required' },
        { status: 400 },
      );
    }

    const backendParams = new URLSearchParams({
      entity_type: entityType,
      entity_ids: entityIds,
    });

    const response = await fetch(
      `${API_BASE_URL}/api/v2/reviews/aggregates?${backendParams.toString()}`,
      {
        headers: {
          'Content-Type': 'application/json',
          Language: 'en',
        },
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data.message || 'Failed to fetch review aggregates' },
        { status: response.status },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Review aggregates API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
