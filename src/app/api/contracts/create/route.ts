import { NextRequest, NextResponse } from 'next/server';
import { protoCreateContract } from '@/lib/proto/contract-client';
import type { CreateContractRequest } from '@/types/contract';
import { serializeBigInt } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    const body: CreateContractRequest = await request.json();

    // Validate required fields
    if (!body.quotationId || !body.title || !body.startDate || !body.endDate) {
      return NextResponse.json(
        { error: 'Missing required fields: quotationId, title, startDate, endDate' },
        { status: 400 }
      );
    }

    const result = await protoCreateContract(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create contract' },
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
    console.error('Create contract API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
