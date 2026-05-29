import { NextRequest, NextResponse } from 'next/server';
import { LocalDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const stats = LocalDb.getStats();
    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats: ' + String(error) },
      { status: 500 }
    );
  }
}
