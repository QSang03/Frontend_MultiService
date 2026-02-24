import { NextResponse } from 'next/server';
import { protoCreateGuest } from '@/lib/proto/crm-client';
import { mapUserProfileToSalesLead } from '@/lib/crm-mapper';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const name = String(body?.name ?? '').trim();
  const email = String(body?.email ?? '').trim();
  const phone = String(body?.phone ?? '').trim();

  if (!name || (!email && !phone)) {
    return NextResponse.json({ error: 'name and (email or phone) are required' }, { status: 400 });
  }

  const result = await protoCreateGuest({
    email,
    phone,
    fullName: name,
  });

  if (!result.success || !result.response || !result.response.user) {
    return NextResponse.json({ error: result.error || 'CreateGuest failed' }, { status: 500 });
  }

  return NextResponse.json({ guest_id: result.response.guestId, guest: mapUserProfileToSalesLead(result.response.user, 'unverified') }, { status: 201 });
}
