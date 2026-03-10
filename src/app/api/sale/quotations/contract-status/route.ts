import { NextResponse } from 'next/server';
import { serializeBigInt } from '@/lib/api-utils';
import { protoGetQuoteContractStatus } from '@/lib/proto/quotation-client';

// GET - Get quote + contract status for a quotation
export async function GET(req: Request) {
  const url = new URL(req.url);
  const quotationId = url.searchParams.get('quotation_id') ?? '';

  if (!quotationId) return NextResponse.json({ error: 'quotation_id is required' }, { status: 400 });

  const result = await protoGetQuoteContractStatus(quotationId);
  if (!result.success || !result.response) {
    return NextResponse.json({ error: result.error || 'GetQuoteContractStatus failed' }, { status: 500 });
  }
  const resp = result.response as Record<string, unknown>;
  return NextResponse.json({
    quotation: serializeBigInt(resp.quotation ?? null),
    contract_id: String(resp.contractId ?? resp.contract_id ?? ''),
    contract_status: String(resp.contractStatus ?? resp.contract_status ?? ''),
  });
}
