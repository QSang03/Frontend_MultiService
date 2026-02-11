import { NextRequest, NextResponse } from 'next/server';
import { protoCancelContract } from '@/lib/proto/contract-client';
import { serializeBigInt } from '@/lib/api-utils';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Contract ID is required' },
        { status: 400 }
      );
    }

    if (!body.reason) {
      return NextResponse.json(
        { error: 'Cancellation reason is required' },
        { status: 400 }
      );
    }

    const result = await protoCancelContract(id, body.reason);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to cancel contract' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        contract: serializeBigInt(result.response?.contract),
      },
    });
  } catch (error) {
    console.error('Cancel contract API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
