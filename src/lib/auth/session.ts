import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { SessionPayload } from '@/types/auth';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'default_secret_key_change_me_in_prod');
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(JWT_SECRET);
}

export async function decrypt(session: string | undefined = '') {
  try {
    const { payload } = await jwtVerify(session, JWT_SECRET, {
      algorithms: ['HS256'],
    });
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export async function createSessionWithTokens(
  user: { id: string; email: string; role?: string; customerId?: string },
  accessToken: string,
  refreshToken: string
) {
  const expires = new Date(Date.now() + SESSION_DURATION);
  
  // Create Session JWT
  const sessionPayload: SessionPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    customerId: user.customerId,
  };
  const session = await encrypt(sessionPayload);

  // Set cookies
  const cookieStore = await cookies();
  const IS_SECURE_COOKIES = process.env.NODE_ENV === 'production';

  cookieStore.set('itms_session', session, {
    httpOnly: true,
    secure: IS_SECURE_COOKIES,
    sameSite: 'lax',
    expires: expires,
    path: '/',
  });

  cookieStore.set('access_token', accessToken, {
    httpOnly: true,
    secure: IS_SECURE_COOKIES,
    sameSite: 'lax',
    maxAge: 15 * 60, // 15 minutes
    path: '/',
  });

  cookieStore.set('refresh_token', refreshToken, {
    httpOnly: true,
    secure: IS_SECURE_COOKIES,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: '/',
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete('itms_session');
  cookieStore.delete('access_token');
  cookieStore.delete('refresh_token');
}

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get('itms_session')?.value;
  if (!session) return null;
  return await decrypt(session);
}

export async function getAccessToken() {
    const cookieStore = await cookies();
    return cookieStore.get('access_token')?.value;
}

export async function getRefreshToken() {
    const cookieStore = await cookies();
    return cookieStore.get('refresh_token')?.value;
}

export async function updateTokens(accessToken: string, refreshToken: string) {
  const cookieStore = await cookies();
  const IS_SECURE_COOKIES = process.env.NODE_ENV === 'production';

  cookieStore.set('access_token', accessToken, {
    httpOnly: true,
    secure: IS_SECURE_COOKIES,
    sameSite: 'lax',
    maxAge: 15 * 60, // 15 minutes
    path: '/',
  });

  cookieStore.set('refresh_token', refreshToken, {
    httpOnly: true,
    secure: IS_SECURE_COOKIES,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: '/',
  });
}

