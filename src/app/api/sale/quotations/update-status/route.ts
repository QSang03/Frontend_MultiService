import { NextResponse } from 'next/server';
import { serializeBigInt } from '@/lib/api-utils';
import { protoUpdateQuotationStatus } from '@/lib/proto/quotation-client';

// POST - Update quotation status
// status values: 0=UNSPECIFIED, 1=DRAFT, 2=SENT, 3=APPROVED, 4=REJECTED, 5=EXPIRED
export async function POST(req: Request) {
  const body = await req.json();
  const id = body.id ?? body.quotation_id ?? '';
  const status = body.status;

  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
  if (status === undefined || status === null) return NextResponse.json({ error: 'status is required' }, { status: 400 });

  const result = await protoUpdateQuotationStatus({ id: String(id), status: Number(status) });
  if (!result.success || !result.response) {
    return NextResponse.json({ error: result.error || 'UpdateQuotationStatus failed' }, { status: 500 });
  }
  const resp = result.response as Record<string, unknown>;
  return NextResponse.json({ quotation: serializeBigInt(resp.quotation ?? resp) });
}
