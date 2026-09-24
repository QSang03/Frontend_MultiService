import { NextRequest, NextResponse } from 'next/server';
import { protoGetClawbackLedger } from '@/lib/proto/contract-client';
import { serializeBigInt, timestampToIso } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const pageSizeRaw = Number(searchParams.get('pageSize') ?? '20');
    const pageSize = Number.isFinite(pageSizeRaw) && pageSizeRaw > 0 ? pageSizeRaw : 20;

    const result = await protoGetClawbackLedger({
      pageSize,
      pageToken: searchParams.get('pageToken') || '',
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to get clawback ledger' },
        { status: 400 }
      );
    }

    const transactions = (result.response?.transactions || []).map((entry) => ({
      ...serializeBigInt(entry),
      createdAt: timestampToIso(entry.createdAt),
    }));

    return NextResponse.json({
      success: true,
      data: {
        transactions,
        nextPageToken: result.response?.nextPageToken || '',
      },
    });
  } catch (error) {
    console.error('Get clawback ledger API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}