import { NextRequest, NextResponse } from 'next/server';
import { protoRequestPayout } from '@/lib/proto/contract-client';
import { serializeBigInt, timestampToIso } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      amount?: string | number;
      note?: string;
    };

    const amountRaw = String(body.amount ?? '').trim();
    const amountValue = Number(amountRaw.replace(/[^\d.-]/g, ''));

    if (!amountRaw || !Number.isFinite(amountValue) || amountValue <= 0) {
      return NextResponse.json({ error: 'Số tiền yêu cầu không hợp lệ' }, { status: 400 });
    }

    const result = await protoRequestPayout({
      amount: amountRaw,
      note: body.note,
    });

    if (!result.success || !result.response?.request) {
      return NextResponse.json(
        { error: result.error || 'Failed to request payout' },
        { status: 400 }
      );
    }

    const payoutRequest = serializeBigInt(result.response.request);

    return NextResponse.json({
      success: true,
      data: {
        request: {
          ...payoutRequest,
          createdAt: timestampToIso((payoutRequest as Record<string, unknown>).createdAt),
          updatedAt: timestampToIso((payoutRequest as Record<string, unknown>).updatedAt),
        },
      },
    });
  } catch (error) {
    console.error('Request payout API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}