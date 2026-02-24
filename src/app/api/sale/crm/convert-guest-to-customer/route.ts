import { NextResponse } from 'next/server';
import { protoConvertGuestToCustomer } from '@/lib/proto/crm-client';
import { mapUserProfileToSalesLead } from '@/lib/crm-mapper';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const guestId = String(body?.guest_id ?? body?.guestId ?? '').trim();
  const verifiedToken = String(body?.verified_token ?? body?.verifiedToken ?? '').trim();

  if (!guestId || !verifiedToken) {
    return NextResponse.json({ error: 'guest_id and verified_token are required' }, { status: 400 });
  }

  const result = await protoConvertGuestToCustomer({ guestId, verifiedToken });
  if (!result.success || !result.response || !result.response.user) {
    return NextResponse.json({ error: result.error || 'ConvertGuestToCustomer failed' }, { status: 400 });
  }

  return NextResponse.json({
    customer: mapUserProfileToSalesLead(result.response.user, 'converted'),
    handoff: {
      password_generated: true,
      welcome_sms_sent: true,
    },
  });
}
