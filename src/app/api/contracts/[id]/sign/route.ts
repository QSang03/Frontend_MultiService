import { NextRequest, NextResponse } from 'next/server';
import { protoSignContract } from '@/lib/proto/contract-client';
import type { SignContractRequest } from '@/types/contract';
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

    const signRequest: SignContractRequest = {
      contractId: id,
      method: body.method,
      signatureData: body.signatureData || '',
      otpCode: body.otpCode || '',
    };

    const result = await protoSignContract(signRequest);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to sign contract' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: serializeBigInt({
        contract: result.response?.contract,
        pdfUrl: result.response?.pdfUrl,
      }),
    });
  } catch (error) {
    console.error('Sign contract API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
