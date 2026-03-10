import { NextRequest, NextResponse } from 'next/server';
import { protoFinalizeContract } from '@/lib/proto/contract-client';
import { serializeBigInt } from '@/lib/api-utils';

export async function POST(
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

    const result = await protoFinalizeContract(id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to finalize contract' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: serializeBigInt({
        contract: result.response?.contract,
      }),
    });
  } catch (error) {
    console.error('Finalize contract API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
