import { NextResponse } from 'next/server';
import { OtpChannel, protoSendAccountOtp } from '@/lib/proto/crm-client';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const guestId = String(body?.guest_id ?? body?.guestId ?? '').trim();
  const channelInput = String(body?.channel ?? '').toUpperCase();
  const channel = channelInput === 'EMAIL' ? OtpChannel.EMAIL : OtpChannel.SMS;

  if (!guestId) {
    return NextResponse.json({ error: 'guest_id is required' }, { status: 400 });
  }

  const result = await protoSendAccountOtp({ userId: guestId, channel });
  if (!result.success || !result.response) {
    return NextResponse.json({ error: result.error || 'SendAccountOtp failed' }, { status: 500 });
  }

  return NextResponse.json({
    success: result.response.success,
    message: result.response.message,
    user_id: guestId,
    verification_state: 'otp_sent',
  });
}
