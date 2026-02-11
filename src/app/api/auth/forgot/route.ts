import { NextResponse } from 'next/server';
import axios from 'axios';
import { API_BASE_URL } from '@/constants';
import { protoForgotPassword } from '@/lib/proto/auth-client';

const USE_PROTOBUF = process.env.NEXT_PUBLIC_USE_PROTOBUF === 'true';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = body?.email;

    if (!email) {
      return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 });
    }

    if (USE_PROTOBUF) {
      const res = await protoForgotPassword(email);
      if (!res.success) {
        return NextResponse.json({ success: false, message: res.error || 'Failed to process forgot password' }, { status: 500 });
      }
      return NextResponse.json({ success: true, message: res.response?.message || 'Email sent' });
    }

    // Fallback to HTTP endpoint
    const response = await axios.post(`${API_BASE_URL}/auth/forgot-password`, { email });
    return NextResponse.json({ success: true, message: response.data?.message || 'Email sent' });
  } catch (error) {
    console.error('Forgot password route error:', error);
    let msg = 'Forgot password failed';
    try {
      const e = error as unknown as Record<string, unknown>;
      const resp = e.response as Record<string, unknown> | undefined;
      const data = resp?.data as Record<string, unknown> | undefined;
      const m = data?.message ?? e.message;
      if (typeof m === 'string') msg = m;
      else if (error instanceof Error) msg = error.message;
      else msg = String(error);
    } catch {
      if (error instanceof Error) msg = error.message;
      else msg = String(error);
    }
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
