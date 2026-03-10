import { NextResponse } from 'next/server';
import { protoSendQuoteToClient } from '@/lib/proto/quotation-client';
import { serializeBigInt } from '@/lib/api-utils';

export async function POST(req: Request) {
  const body = await req.json();
  const quotationId = body.quotation_id ?? body.quotationId ?? '';

  if (!quotationId) {
    return NextResponse.json({ error: 'quotation_id is required' }, { status: 400 });
  }

  const result = await protoSendQuoteToClient(String(quotationId));

  if (!result.success || !result.response) {
    return NextResponse.json({ error: result.error || 'SendQuoteToClient failed' }, { status: 500 });
  }

  const resp = result.response as Record<string, unknown>;
  return NextResponse.json({ quotation: serializeBigInt(resp.quotation ?? resp) });
}
