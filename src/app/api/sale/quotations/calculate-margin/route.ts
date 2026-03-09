import { NextResponse } from 'next/server';
import { protoCalculateMargin } from '@/lib/proto/ticket-client';

export async function POST(req: Request) {
  const body = await req.json();
  const ticketId = body.ticket_id ?? body.ticketId ?? '';
  const quotationId = body.quotation_id ?? body.quotationId ?? '';
  const totalAmount = body.total_amount ?? body.totalAmount ?? '0';
  const items = body.items ?? '[]';

  if (!ticketId) {
    return NextResponse.json({ error: 'ticket_id is required' }, { status: 400 });
  }

  const result = await protoCalculateMargin({
    ticketId: String(ticketId),
    quotationId: String(quotationId),
    totalAmount: String(totalAmount),
    items: typeof items === 'string' ? items : JSON.stringify(items),
  });

  if (!result.success || !result.response) {
    return NextResponse.json({ error: result.error || 'CalculateMargin failed' }, { status: 500 });
  }

  const resp = result.response as Record<string, unknown>;
  return NextResponse.json({
    gross_margin_percent: String(resp.grossMarginPercent ?? resp.gross_margin_percent ?? '0'),
    net_profit: String(resp.netProfit ?? resp.net_profit ?? '0'),
    total_cost: String(resp.totalCost ?? resp.total_cost ?? '0'),
  });
}
