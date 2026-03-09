import { NextResponse } from 'next/server';
import { protoRequestInternalReview } from '@/lib/proto/ticket-client';
import { serializeBigInt } from '@/lib/api-utils';

export async function POST(req: Request) {
  const body = await req.json();
  const ticketId = body.ticket_id ?? body.ticketId ?? '';
  const quotationId = body.quotation_id ?? body.quotationId ?? '';
  const note = body.note ?? '';

  if (!ticketId || !quotationId) {
    return NextResponse.json({ error: 'ticket_id and quotation_id are required' }, { status: 400 });
  }

  const result = await protoRequestInternalReview({
    ticketId: String(ticketId),
    quotationId: String(quotationId),
    note: String(note),
  });

  if (!result.success || !result.response) {
    return NextResponse.json({ error: result.error || 'RequestInternalReview failed' }, { status: 500 });
  }

  const resp = result.response as Record<string, unknown>;
  return NextResponse.json({ ticket: serializeBigInt(resp.ticket ?? resp) });
}
