import { NextResponse } from 'next/server';
import { protoCreateGuest } from '@/lib/proto/crm-client';
import { mapUserProfileToSalesLead } from '@/lib/crm-mapper';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const name = String(body?.name ?? body?.full_name ?? '').trim();
  const email = String(body?.email ?? '').trim();
  const phone = String(body?.phone ?? '').trim();

  if (!email && !phone) {
    return NextResponse.json({ error: 'email or phone is required' }, { status: 400 });
  }

  const result = await protoCreateGuest({ email, phone, fullName: name });

  // User already exists → still return 200 so FE continues to OTP step
  if (!result.success && result.error?.includes('User already exists')) {
    return NextResponse.json({
      guest_id: email || phone,
      existing: true,
      contact: email || phone,
    }, { status: 200 });
  }

  if (!result.success || !result.response || !result.response.user) {
    return NextResponse.json({ error: result.error || 'CreateGuest failed' }, { status: 500 });
  }

  return NextResponse.json({
    guest_id: result.response.guestId,
    guest: mapUserProfileToSalesLead(result.response.user, 'unverified'),
  }, { status: 201 });
}
