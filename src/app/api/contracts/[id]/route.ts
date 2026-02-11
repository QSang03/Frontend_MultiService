import { NextRequest, NextResponse } from 'next/server';
import { protoGetContract } from '@/lib/proto/contract-client';
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

    const result = await protoGetContract(id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to get contract' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        contract: serializeBigInt(result.response?.contract),
      },
    });
  } catch (error) {
    console.error('Get contract API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
