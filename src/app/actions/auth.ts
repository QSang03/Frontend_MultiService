'use server';

import { createSessionWithTokens, deleteSession, getRefreshToken } from '@/lib/auth/session';
import serverApiClient from '@/lib/api/server-client';
import { AuthResponse } from '@/types/auth';
import { isAxiosError } from 'axios';

// Feature flag: set NEXT_PUBLIC_USE_PROTOBUF=true to prefer protobuf
const USE_PROTOBUF = process.env.NEXT_PUBLIC_USE_PROTOBUF === 'true';

/**
 * Attempt login via protobuf client, fallback to HTTP if proto fails or disabled
 */
export async function login(_prevState: unknown, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Please enter both email and password' };
  }

  // Try protobuf first if enabled
  if (USE_PROTOBUF) {
    try {
      console.log('[auth] Attempting proto login for:', email);
      const { protoLogin } = await import('@/lib/proto/auth-client');
      const protoResult = await protoLogin(email, password);
      
      console.log('[auth] Proto login result:', { 
        success: protoResult.success, 
        hasResponse: !!protoResult.response,
        error: protoResult.error 
      });
      
      if (protoResult.success && protoResult.response) {
        const res = protoResult.response;
        
        console.log('[auth] Proto response details:', {
          hasTokens: !!res.tokens,
          hasUser: !!res.user,
          mfaRequired: res.mfaRequired
        });
        
        if (res.tokens && res.user) {
          await createSessionWithTokens(
            {
              id: res.user.id,
              email: res.user.email,
              role: res.user.role !== undefined ? String(res.user.role) : undefined,
            },
            res.tokens.accessToken,
            res.tokens.refreshToken
          );
          console.log('[auth] Session created successfully for user:', res.user.email);
          return { 
            success: true, 
            user: {
              id: res.user.id,
              email: res.user.email,
              name: res.user.fullName || res.user.email,
              role: res.user.role !== undefined ? String(res.user.role) : undefined,
            }
          };
        }

        if (res.mfaRequired) {
          console.log('[auth] MFA required for user');
          return {
            mfa_required: true,
            mfa_token: res.mfaToken,
          };
        }
      }

      // If proto returned an error, show it to user
      if (protoResult.error) {
        const errMsg = protoResult.error.toLowerCase();
        
        console.error('[auth] Proto login error:', protoResult.error);
        
        // Map common gRPC/proto errors to user-friendly messages
        if (errMsg.includes('unauthenticated') || errMsg.includes('invalid credentials')) {
          return { error: 'Email hoặc mật khẩu không đúng' };
        }
        if (errMsg.includes('not_found') || errMsg.includes('not found')) {
          return { error: 'Tài khoản không tồn tại' };
        }
        
        console.warn('[auth] Proto login failed:', protoResult.error);
        return { error: 'Đăng nhập thất bại: ' + protoResult.error };
      }
    } catch (protoErr) {
      const errMsg = protoErr instanceof Error ? protoErr.message : String(protoErr);
      console.warn('[auth] Proto login exception:', errMsg);
      
      // Only fallback on connection errors, otherwise show error
      if (!errMsg.toLowerCase().includes('connect') && !errMsg.toLowerCase().includes('network')) {
        return { error: 'Đã có lỗi xảy ra khi đăng nhập' };
      }
    }
  }

  // HTTP fallback
  try {
    const response = await serverApiClient.post<AuthResponse>('/v1/auth/login', {
      email,
      password,
    });

    const data = response.data;

    if (data.mfa_required) {
      return {
        error: 'MFA required but not implemented in this demo',
        mfa_token: data.mfa_token,
      };
    }

    if (data.tokens && data.user) {
      await createSessionWithTokens(
        data.user,
        data.tokens.access_token,
        data.tokens.refresh_token
      );
      return { success: true, user: data.user };
    }

    return { error: 'Invalid response from server' };

  } catch (error) {
    if (isAxiosError(error)) {
      console.error('Login error:', error.response?.data);
      return { error: error.response?.data?.message || 'Login failed' };
    }
    console.error('Login error:', error);
    return { error: 'Something went wrong' };
  }
}

export async function register(_prevState: unknown, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('full_name') as string;
  const phone = formData.get('phone') as string;
  const organization = formData.get('organization') as string;

  if (!email || !password || !fullName) {
    return { error: 'Vui lòng điền đầy đủ thông tin bắt buộc' };
  }

  // Try protobuf first if enabled
  if (USE_PROTOBUF) {
    try {
      const { protoRegister } = await import('@/lib/proto/auth-client');
      const protoResult = await protoRegister({
        email,
        password,
        full_name: fullName,
        phone: phone || undefined,
      });

      if (protoResult.success && protoResult.response) {
        const res = protoResult.response;
        
        if (res.user) {
          // Nếu có tokens, tạo session luôn (auto login sau đăng ký)
          if (res.tokens) {
            await createSessionWithTokens(
              {
                id: res.user.id,
                email: res.user.email,
                role: res.user.role !== undefined ? String(res.user.role) : undefined,
              },
              res.tokens.accessToken,
              res.tokens.refreshToken
            );
          }
          return { 
            success: true, 
            user: {
              id: res.user.id,
              email: res.user.email,
              name: res.user.fullName || res.user.email,
              role: res.user.role !== undefined ? String(res.user.role) : undefined,
            }
          };
        }
      }

      if (protoResult.error) {
        // Check if it's a business logic error (not network error)
        // Business errors should be shown to user, not fallback
        const errMsg = protoResult.error.toLowerCase();
        if (errMsg.includes('already_exists') || errMsg.includes('already exists')) {
          return { error: 'Email hoặc số điện thoại đã tồn tại' };
        }
        if (errMsg.includes('invalid') || errMsg.includes('validation')) {
          return { error: 'Dữ liệu không hợp lệ' };
        }
        // Log and return other proto errors too
        console.warn('[auth] Proto register failed:', protoResult.error);
        return { error: protoResult.error };
      }
    } catch (protoErr) {
      // Network/connection errors - could fallback or show error
      const errMsg = protoErr instanceof Error ? protoErr.message : String(protoErr);
      console.warn('[auth] Proto register exception:', errMsg);
      
      // Only fallback on connection errors
      if (!errMsg.toLowerCase().includes('connect') && !errMsg.toLowerCase().includes('network')) {
        return { error: 'Đã có lỗi xảy ra khi đăng ký' };
      }
    }
  }

  // HTTP fallback
  try {
    const response = await serverApiClient.post('/v1/auth/register', {
      email,
      full_name: fullName,
      password,
      phone: phone || undefined,
      organization: organization || null,
    });

    return { success: true, user: response.data };

  } catch (error) {
    if (isAxiosError(error)) {
      console.error('Register error:', error.response?.data);
      if (error.response?.status === 409) {
        return { error: 'Email hoặc số điện thoại đã tồn tại' };
      }
      if (error.response?.status === 400) {
        const data = error.response.data;
        const detail = data.error || data.detail || data.message;
        return { error: detail || 'Dữ liệu không hợp lệ' };
      }
      const data = error.response?.data;
      return { error: data?.error || data?.message || 'Đăng ký thất bại' };
    }
    console.error('Register error:', error);
    return { error: 'Đã có lỗi xảy ra' };
  }
}

export async function logout() {
  try {
    // Attempt to revoke refresh token on backend
    const refreshToken = await getRefreshToken();
    if (refreshToken) {
      try {
        await serverApiClient.post('/auth/logout', { refresh_token: refreshToken });
      } catch (err) {
        // If logout endpoint is not found, treat as non-fatal — session will be cleared locally anyway.
        if (isAxiosError(err) && err.response?.status === 404) {
          console.debug('Logout endpoint not found on backend; skipping remote revoke.');
        } else {
          console.error('Logout backend error:', err);
        }
      }
    }
  } catch (error) {
    console.error('Logout backend error:', error);
  }

  // Clear cookies/server session and return status to client
  await deleteSession();
  return { success: true };
}
