import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { success: false, message: 'V2 travel plan item review API is not implemented yet' },
    { status: 501 },
  );
}

export async function POST() {
  return NextResponse.json(
    { success: false, message: 'V2 travel plan item review API is not implemented yet' },
    { status: 501 },
  );
}
