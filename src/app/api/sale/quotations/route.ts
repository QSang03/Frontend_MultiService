import { NextResponse } from 'next/server';
import { protoSubmitQuotation } from '@/lib/proto/ticket-client';
import { protoUpdateQuotation, protoDeleteQuotation } from '@/lib/proto/quotation-client';
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

// PUT - Update draft quotation content
export async function PUT(req: Request) {
  const body = await req.json() as Record<string, unknown>;
  const { id, total_amount, tax_amount, currency, items, note } = body;
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const result = await protoUpdateQuotation({
    id: String(id),
    totalAmount: total_amount !== undefined ? String(total_amount) : undefined,
    taxAmount: tax_amount !== undefined ? String(tax_amount) : undefined,
    currency: currency !== undefined ? String(currency) : undefined,
    items: items !== undefined ? (typeof items === 'string' ? items : JSON.stringify(items)) : undefined,
    note: note !== undefined ? String(note) : undefined,
  });

  if (!result.success || !result.response) {
    return NextResponse.json({ error: result.error || 'UpdateQuotation failed' }, { status: 500 });
  }
  const resp = result.response as Record<string, unknown>;
  return NextResponse.json({ quotation: serializeBigInt(resp.quotation ?? resp) });
}

// DELETE - Delete a draft quotation
export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id') ?? '';
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const result = await protoDeleteQuotation(id);
  if (!result.success) {
    return NextResponse.json({ error: result.error || 'DeleteQuotation failed' }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

