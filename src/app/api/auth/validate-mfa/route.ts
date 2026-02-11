import { NextResponse } from 'next/server';
import { validateMfaLogin } from '@/app/actions/mfa';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mfaToken, code } = body;
    if (!mfaToken || !code) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const result = await validateMfaLogin(mfaToken, code);

    if (result.success) {
      return NextResponse.json({ success: true, redirect: '/' });
    }

    return NextResponse.json({ error: result.error || 'MFA validation failed' }, { status: 401 });
  } catch (err) {
    console.error('Validate MFA route error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
