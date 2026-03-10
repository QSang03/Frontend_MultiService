import { NextRequest, NextResponse } from 'next/server';
import { protoGetContractTimeline } from '@/lib/proto/contract-client';
import { serializeBigInt } from '@/lib/api-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Contract ID is required' },
        { status: 400 }
      );
    }

    const result = await protoGetContractTimeline(id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to get contract timeline' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: serializeBigInt({
        events: result.response?.events || [],
      }),
    });
  } catch (error) {
    console.error('Get contract timeline API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
