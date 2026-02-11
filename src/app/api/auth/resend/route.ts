'use server';

import { NextResponse } from 'next/server';
import { protoResendVerification } from '@/lib/proto/auth-client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = body?.email;
    if (!email) return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });

    const result = await protoResendVerification(email);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error || 'Failed to resend verification' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: result.response?.message || 'Verification email sent' });
  } catch (err) {
    console.error('[resend route] Error:', err);
    return NextResponse.json({ success: false, error: (err as Error)?.message || 'Internal error' }, { status: 500 });
  }
}
