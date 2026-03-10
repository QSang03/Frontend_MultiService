import { NextResponse } from 'next/server';
import { protoCreateQuotation } from '@/lib/proto/quotation-client';
import { serializeBigInt } from '@/lib/api-utils';

// POST - Create a new quotation (CreateQuotationRequest)
export async function POST(req: Request) {
  const body = await req.json();
  const customerId = body.customer_id ?? body.customerId;
  const ticketId = body.ticket_id ?? body.ticketId;
  const templateId = body.template_id ?? body.templateId;
  const totalAmount = body.total_amount ?? body.totalAmount ?? '0';
  const taxAmount = body.tax_amount ?? body.taxAmount ?? '0';
  const currency = body.currency ?? 'VND';
  const items = body.items ?? '[]';
  const note = body.note;

  if (!customerId) {
    return NextResponse.json({ error: 'customer_id is required' }, { status: 400 });
  }

  const result = await protoCreateQuotation({
    customerId: String(customerId),
    ticketId: ticketId ? String(ticketId) : undefined,
    templateId: templateId ? String(templateId) : undefined,
    totalAmount: String(totalAmount),
    taxAmount: String(taxAmount),
    currency: String(currency),
    items: typeof items === 'string' ? items : JSON.stringify(items),
    note: note ? String(note) : undefined,
  });

  if (!result.success || !result.response) {
    return NextResponse.json({ error: result.error || 'CreateQuotation failed' }, { status: 500 });
  }

  const resp = result.response as Record<string, unknown>;
  return NextResponse.json({ quotation: serializeBigInt(resp.quotation ?? resp) }, { status: 201 });
}
