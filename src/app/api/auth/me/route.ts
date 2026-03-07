import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

type JwtPayload = Record<string, unknown>;

function decodeJwtPayload(token: string): JwtPayload | null {
  const parts = token.split('.');
  if (parts.length < 2) return null;

  try {
    const payloadBase64Url = parts[1];
    const payloadBase64 = payloadBase64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = payloadBase64.padEnd(Math.ceil(payloadBase64.length / 4) * 4, '=');
    const json = Buffer.from(padded, 'base64').toString('utf8');
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

function resolveUserId(payload: JwtPayload): string {
  const candidates = [
    payload.user_id,
    payload.userId,
    payload.uid,
    payload.sub,
    payload.id,
  ];

  for (const candidate of candidates) {
    const value = String(candidate ?? '').trim();
    if (value) return value;
  }

  return '';
}

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  if (!accessToken) {
    return NextResponse.json({ authenticated: false, user_id: '' }, { status: 401 });
  }

  const payload = decodeJwtPayload(accessToken);
  if (!payload) {
    return NextResponse.json({ authenticated: false, user_id: '' }, { status: 401 });
  }

  const userId = resolveUserId(payload);
  if (!userId) {
    return NextResponse.json({ authenticated: false, user_id: '' }, { status: 401 });
  }

  return NextResponse.json({ authenticated: true, user_id: userId });
}
