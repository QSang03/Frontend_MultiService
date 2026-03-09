import { NextResponse } from 'next/server';
import { protoSubmitQuotation } from '@/lib/proto/ticket-client';
import { serializeBigInt } from '@/lib/api-utils';

// POST - Submit a new quotation
export async function POST(req: Request) {
  const body = await req.json();
  const ticketId = body.ticket_id ?? body.ticketId;
  const totalAmount = body.total_amount ?? body.totalAmount ?? '0';
  const taxAmount = body.tax_amount ?? body.taxAmount ?? '0';
  const currency = body.currency ?? 'VND';
  const note = body.note ?? '';
  const items = body.items ?? '[]';

  if (!ticketId) {
    return NextResponse.json({ error: 'ticket_id is required' }, { status: 400 });
  }

  const result = await protoSubmitQuotation({
    ticketId: String(ticketId),
    totalAmount: String(totalAmount),
    taxAmount: String(taxAmount),
    currency,
    note,
    items: typeof items === 'string' ? items : JSON.stringify(items),
  });

  if (!result.success || !result.response) {
    return NextResponse.json({ error: result.error || 'SubmitQuotation failed' }, { status: 500 });
  }

  const resp = result.response as Record<string, unknown>;
  return NextResponse.json({ quotation: serializeBigInt(resp.quotation ?? resp) }, { status: 201 });
}
