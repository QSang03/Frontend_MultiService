import { NextResponse } from 'next/server';
import { protoGetCommissionDetail } from '@/lib/proto/contract-client';
import { serializeBigInt, timestampToIso } from '@/lib/api-utils';

type RouteContext = {
  params: Promise<{
    commissionId: string;
  }>;
};

function mapDetail(detail: { case: string | undefined; value?: unknown }) {
  if (detail.case === 'ticket' && detail.value) {
    const ticket = serializeBigInt(detail.value as Record<string, unknown>);
    return {
      case: 'ticket',
      value: {
        ...ticket,
        createdAt: timestampToIso((ticket as Record<string, unknown>).createdAt),
        closedAt: timestampToIso((ticket as Record<string, unknown>).closedAt),
      },
    };
  }

  if (detail.case === 'contract' && detail.value) {
    return {
      case: 'contract',
      value: serializeBigInt(detail.value as Record<string, unknown>),
    };
  }

  return {
    case: undefined,
    value: undefined,
  };
}

export async function GET(_: Request, context: RouteContext) {
  try {
    const { commissionId } = await context.params;

    if (!commissionId) {
      return NextResponse.json({ error: 'commissionId is required' }, { status: 400 });
    }

    const result = await protoGetCommissionDetail(commissionId);

    if (!result.success || !result.response) {
      return NextResponse.json(
        { error: result.error || 'Failed to get commission detail' },
        { status: 400 }
      );
    }

    const response = serializeBigInt(result.response);

    return NextResponse.json({
      success: true,
      data: {
        ...response,
        detail: mapDetail(response.detail as { case: string | undefined; value?: unknown }),
      },
    });
  } catch (error) {
    console.error('Get commission detail API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}