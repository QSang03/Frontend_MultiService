import { NextRequest, NextResponse } from 'next/server';
import { protoListMyCommissions } from '@/lib/proto/contract-client';
import { serializeBigInt, timestampToIso } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const pageSizeRaw = Number(searchParams.get('pageSize') ?? '20');
    const pageSize = Number.isFinite(pageSizeRaw) && pageSizeRaw > 0 ? pageSizeRaw : 20;

    const result = await protoListMyCommissions({
      pageSize,
      pageToken: searchParams.get('pageToken') || '',
      status: searchParams.get('status') || undefined,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to list commissions' },
        { status: 400 }
      );
    }

    const commissions = (result.response?.commissions || []).map((entry) => ({
      ...serializeBigInt(entry),
      createdAt: timestampToIso(entry.createdAt),
      updatedAt: timestampToIso(entry.updatedAt),
    }));

    return NextResponse.json({
      success: true,
      data: {
        commissions,
        nextPageToken: result.response?.nextPageToken || '',
        totalCount: result.response?.totalCount || 0,
      },
    });
  } catch (error) {
    console.error('List commissions API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}