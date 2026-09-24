import { NextResponse } from 'next/server';
import { protoGetSaleMeStats } from '@/lib/proto/contract-client';

export async function GET() {
  try {
    const result = await protoGetSaleMeStats();

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to get sale stats' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.response,
    });
  } catch (error) {
    console.error('Get sale stats API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}