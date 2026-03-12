import { NextResponse } from 'next/server';
import { protoCancelPayout } from '@/lib/proto/contract-client';
import { serializeBigInt, timestampToIso } from '@/lib/api-utils';

type RouteContext = {
  params: Promise<{
    payoutId: string;
  }>;
};

export async function POST(_: Request, context: RouteContext) {
  try {
    const { payoutId } = await context.params;

    if (!payoutId) {
      return NextResponse.json({ error: 'payoutId is required' }, { status: 400 });
    }

    const result = await protoCancelPayout(payoutId);

    if (!result.success || !result.response?.request) {
      return NextResponse.json(
        { error: result.error || 'Failed to cancel payout' },
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
    console.error('Cancel payout API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}