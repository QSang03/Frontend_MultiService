import { NextResponse } from 'next/server';
import { protoConvertToContract } from '@/lib/proto/quotation-client';

// POST - Convert approved quotation to contract
export async function POST(req: Request) {
  const body = await req.json();
  const quotationId = body.quotation_id ?? body.quotationId ?? '';
  const title = body.title ?? '';
  const startDate = body.start_date ?? body.startDate ?? '';
  const endDate = body.end_date ?? body.endDate ?? '';

  if (!quotationId) return NextResponse.json({ error: 'quotation_id is required' }, { status: 400 });
  if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 });
  if (!startDate || !endDate) return NextResponse.json({ error: 'start_date and end_date are required' }, { status: 400 });

  const result = await protoConvertToContract({ quotationId, title, startDate, endDate });
  if (!result.success || !result.response) {
    return NextResponse.json({ error: result.error || 'ConvertToContract failed' }, { status: 500 });
  }
  const resp = result.response as Record<string, unknown>;
  return NextResponse.json({
    contract_id: String(resp.contractId ?? resp.contract_id ?? ''),
    status: String(resp.status ?? ''),
  });
}
