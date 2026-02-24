import { NextResponse } from 'next/server';
import { protoVerifyAccountOtp } from '@/lib/proto/crm-client';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const guestId = String(body?.guest_id ?? body?.guestId ?? '').trim();
  const otpCode = body?.otp_code == null ? '' : String(body.otp_code);

  if (!guestId) {
    return NextResponse.json({ error: 'guest_id is required' }, { status: 400 });
  }

  if (!otpCode) {
    return NextResponse.json({ error: 'otp_code is required' }, { status: 400 });
  }

  const result = await protoVerifyAccountOtp({ userId: guestId, code: otpCode });
  if (!result.success || !result.response) {
    return NextResponse.json({ error: result.error || 'VerifyAccountOtp failed' }, { status: 400 });
  }

  return NextResponse.json({
    success: result.response.success,
    verified_token: result.response.verifiedToken,
    user_id: guestId,
    verification_state: 'verified',
  });
}
