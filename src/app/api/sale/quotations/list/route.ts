import { NextResponse } from 'next/server';
import { serializeBigInt } from '@/lib/api-utils';
import { protoListQuotations } from '@/lib/proto/quotation-client';

// GET - List quotations
export async function GET(req: Request) {
  const url = new URL(req.url);
  const orgId = url.searchParams.get('org_id') ?? undefined;
  const customerId = url.searchParams.get('customer_id') ?? undefined;
  const saleId = url.searchParams.get('sale_id') ?? undefined;
  const statusParam = url.searchParams.get('status');
  const status = statusParam !== null ? parseInt(statusParam, 10) : undefined;
  const pageSize = parseInt(url.searchParams.get('page_size') ?? '50', 10);
  const pageToken = url.searchParams.get('page_token') ?? '';

  const result = await protoListQuotations({ orgId, customerId, saleId, status, pageSize, pageToken });
  if (!result.success || !result.response) {
    return NextResponse.json({ error: result.error || 'ListQuotations failed' }, { status: 500 });
  }
  const resp = result.response as Record<string, unknown>;
  return NextResponse.json({
    quotations: serializeBigInt(resp.quotations ?? []),
    next_page_token: resp.nextPageToken ?? resp.next_page_token ?? '',
    total_count: resp.totalCount ?? resp.total_count ?? 0,
  });
}
