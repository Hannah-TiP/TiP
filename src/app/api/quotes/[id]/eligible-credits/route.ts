import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { languageHeader } from '@/lib/proxy-language';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

// SMA-329: the backend endpoint kept its path but now returns the
// QuoteWalletSummary (wallet balance / per-booking cap / applied points)
// instead of the retired per-credit eligibility list.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const accessToken = session?.accessToken;

    if (!accessToken) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const response = await fetch(`${API_BASE_URL}/api/v2/quotes/${id}/eligible-credits`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...languageHeader(request),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data.message || 'Failed to load wallet summary' },
        { status: response.status },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Wallet summary API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
