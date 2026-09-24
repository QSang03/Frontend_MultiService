import { NextResponse } from 'next/server';
import { protoCalculateQuotationMargin } from '@/lib/proto/quotation-client';
import { getSession } from '@/lib/auth/session';

export async function POST(req: Request) {
  const body = await req.json();
  const totalAmount = body.total_amount ?? body.totalAmount ?? '0';
  const items = body.items ?? '[]';
  const taxAmount = body.tax_amount ?? body.taxAmount ?? undefined;

  // Get creator_id from session
  let creatorId: string | undefined;
  try {
    const session = await getSession();
    creatorId = session?.userId ?? undefined;
  } catch { /* no session */ }

  const result = await protoCalculateQuotationMargin({
    totalAmount: String(totalAmount),
    items: typeof items === 'string' ? items : JSON.stringify(items),
    ...(creatorId ? { creatorId } : {}),
    ...(taxAmount ? { taxAmount: String(taxAmount) } : {}),
  });

  if (!result.success || !result.response) {
    return NextResponse.json({ error: result.error || 'CalculateMargin failed' }, { status: 500 });
  }

  const resp = result.response as Record<string, unknown>;
  return NextResponse.json({
    margin_percent: String(resp.marginPercent ?? resp.margin_percent ?? '0'),
    net_profit: String(resp.netProfit ?? resp.net_profit ?? '0'),
    expected_commission: resp.expectedCommission != null ? String(resp.expectedCommission) : undefined,
    commission_rate: resp.commissionRate != null ? String(resp.commissionRate) : undefined,
  });
}
