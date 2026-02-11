import { NextResponse } from 'next/server';
import axios from 'axios';
import { API_BASE_URL } from '@/constants';
import { protoResetPassword } from '@/lib/proto/auth-client';

const USE_PROTOBUF = process.env.NEXT_PUBLIC_USE_PROTOBUF === 'true';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = body?.token as string | undefined;
    const newPassword = body?.new_password as string | undefined;

    if (!token || !newPassword) {
      return NextResponse.json({ success: false, message: 'Token và mật khẩu mới là bắt buộc' }, { status: 400 });
    }

    if (USE_PROTOBUF) {
      const res = await protoResetPassword(token, newPassword);
      if (!res.success) {
        return NextResponse.json({ success: false, message: res.error || 'Đặt lại mật khẩu thất bại' }, { status: 500 });
      }
      return NextResponse.json({ success: true, message: res.response?.message || 'Đặt lại mật khẩu thành công' });
    }

    // HTTP fallback
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/reset-password`, {
        token,
        new_password: newPassword,
      });
      return NextResponse.json({ success: true, message: response.data?.message || 'Đặt lại mật khẩu thành công' });
    } catch (err) {
      const e = err as unknown as Record<string, unknown>;
      const status = (e.response as Record<string, unknown> | undefined)?.status as number | undefined;
      if (status === 404) {
        const response = await axios.post(`${API_BASE_URL}/v1/auth/reset-password`, {
          token,
          new_password: newPassword,
        });
        return NextResponse.json({ success: true, message: response.data?.message || 'Đặt lại mật khẩu thành công' });
      }
      throw err;
    }
  } catch (error) {
    let msg = 'Đặt lại mật khẩu thất bại';
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
