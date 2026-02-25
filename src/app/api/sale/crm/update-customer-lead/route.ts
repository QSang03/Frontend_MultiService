import { NextResponse } from 'next/server';
import { protoUpdateCustomerLead } from '@/lib/proto/crm-client';
import { mapUserProfileToSalesLead } from '@/lib/crm-mapper';

export async function PATCH(req: Request) {
  const body = await req.json().catch(() => ({}));
  const userId = String(body?.user_id ?? body?.userId ?? '').trim();
  const email = String(body?.email ?? '').trim();
  const phone = String(body?.phone ?? '').trim();
  const fullName = String(body?.full_name ?? body?.fullName ?? '').trim();

  if (!userId) {
    return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
  }

  if (!email && !phone && !fullName) {
    return NextResponse.json({ error: 'At least one field (email, phone, full_name) is required' }, { status: 400 });
  }

  const result = await protoUpdateCustomerLead({
    userId,
    email: email || undefined,
    phone: phone || undefined,
    fullName: fullName || undefined,
  });

  if (!result.success || !result.response) {
    return NextResponse.json({ error: result.error || 'UpdateCustomerLead failed' }, { status: 500 });
  }

  const response = result.response as Record<string, unknown>;
  const user = response.user;

  if (!user) {
    return NextResponse.json({ error: 'UpdateCustomerLead response does not contain user' }, { status: 500 });
  }

  return NextResponse.json({ lead: mapUserProfileToSalesLead(user) });
}
