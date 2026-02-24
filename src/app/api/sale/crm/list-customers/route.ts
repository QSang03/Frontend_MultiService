import { NextResponse } from 'next/server';
import { protoListCustomers } from '@/lib/proto/crm-client';
import { mapUserProfileToSalesLead } from '@/lib/crm-mapper';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const pageSize = Number(searchParams.get('page_size') || '20');
  const pageToken = searchParams.get('page_token') || '';
  const searchTerm = searchParams.get('search_term') || undefined;

  const result = await protoListCustomers({ pageSize, pageToken, searchTerm });
  if (!result.success || !result.response) {
    return NextResponse.json({ error: result.error || 'ListCustomers failed' }, { status: 500 });
  }

  return NextResponse.json({
    customers: result.response.customers.map((user) => mapUserProfileToSalesLead(user, 'converted')),
    next_page_token: result.response.nextPageToken,
    total_count: result.response.totalCount,
  });
}
