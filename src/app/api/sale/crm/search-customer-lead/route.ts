import { NextResponse } from 'next/server';
import { protoSearchCustomerLead } from '@/lib/proto/crm-client';
import { mapUserProfileToSalesLead } from '@/lib/crm-mapper';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const query = String(body?.query ?? body?.contact ?? '').trim();

  if (!query) {
    return NextResponse.json({ error: 'query is required' }, { status: 400 });
  }

  const result = await protoSearchCustomerLead({ query });
  if (!result.success || !result.response) {
    return NextResponse.json({ error: result.error || 'SearchCustomerLead failed' }, { status: 500 });
  }

  const { found, user } = result.response;
  if (!found || !user) {
    return NextResponse.json({ caseType: 'C', found: false });
  }

  const isGuest = Boolean(user.isGuest);
  const caseType = isGuest ? 'B' : 'A';

  return NextResponse.json({
    caseType,
    found: true,
    lead: mapUserProfileToSalesLead(user),
  });
}
