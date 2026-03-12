import { NextRequest, NextResponse } from 'next/server';
import { protoListMyPayouts } from '@/lib/proto/contract-client';
import { serializeBigInt, timestampToIso } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const pageSizeRaw = Number(searchParams.get('pageSize') ?? '10');
    const pageSize = Number.isFinite(pageSizeRaw) && pageSizeRaw > 0 ? pageSizeRaw : 10;
    const statusRaw = searchParams.get('status');
    const statusValue = statusRaw == null ? undefined : Number(statusRaw);

    const result = await protoListMyPayouts({
      pageSize,
      pageToken: searchParams.get('pageToken') || '',
      status: Number.isFinite(statusValue) ? statusValue : undefined,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to list payouts' },
        { status: 400 }
      );
    }

    const requests = (result.response?.requests || []).map((entry) => {
      const serialized = serializeBigInt(entry);
      return {
        ...serialized,
        createdAt: timestampToIso(entry.createdAt),
        updatedAt: timestampToIso(entry.updatedAt),
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        requests,
        nextPageToken: result.response?.nextPageToken || '',
        totalCount: result.response?.totalCount || 0,
      },
    });
  } catch (error) {
    console.error('List payouts API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}