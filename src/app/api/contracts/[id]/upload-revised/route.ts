import { NextRequest, NextResponse } from 'next/server';
import { protoUploadRevisedContract } from '@/lib/proto/contract-client';
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

    const body = await request.json();
    const { fileType, fileId } = body;

    if (!fileType || !fileId) {
      return NextResponse.json(
        { error: 'fileType and fileId are required' },
        { status: 400 }
      );
    }

    const result = await protoUploadRevisedContract(id, fileType, fileId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to upload revised contract' },
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
    console.error('Upload revised contract API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
