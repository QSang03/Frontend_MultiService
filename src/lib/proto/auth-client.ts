/**
 * Protobuf/Connect client for AuthService (server-side)
 * Raw gRPC (HTTP/2) must be called from server, not browser.
 */

import 'server-only';
import { createClient } from '@connectrpc/connect';
import { createGrpcTransport } from '@connectrpc/connect-node';
import { create } from '@bufbuild/protobuf';
import { getAccessToken, deleteSession } from '@/lib/auth/session';
import { refreshTokens } from '@/lib/auth/refresh';
import {
  AuthService,
  LoginRequestSchema,
  RegisterRequestSchema,
  LoginResponse,
  RegisterResponse,
  MfaGenerateRequestSchema,
  MfaGenerateResponse,
  MfaVerifyRequestSchema,
  MfaVerifyResponse,
  MfaValidateRequestSchema,
  MfaValidateResponse,
  MfaDisableRequestSchema,
  MfaDisableResponse,
  GetRecoveryCodesRequestSchema,
  GetRecoveryCodesResponse,
  RefreshTokenRequestSchema,
  RefreshTokenResponse,
  GetProfileRequestSchema,
  GetProfileResponse,
  UpdateProfileRequestSchema,
  UpdateProfileResponse,
  GetSessionsRequestSchema,
  GetSessionsResponse,
  RevokeSessionRequestSchema,
  RevokeSessionResponse,
  RevokeOtherSessionsRequestSchema,
  RevokeOtherSessionsResponse,
  ResendVerificationRequestSchema,
  ResendVerificationResponse,
  VerifyEmailRequestSchema,
  VerifyEmailResponse,
  ForgotPasswordRequestSchema,
  ForgotPasswordResponse,
  ResetPasswordRequestSchema,
  ResetPasswordResponse,
  DeleteAccountRequestSchema,
  DeleteAccountResponse,
} from '@buf/nkc_multiservice.bufbuild_es/multiservice/auth/v1/auth_pb.js';

// Backend URL for raw gRPC over HTTP/2 (server-side).
// Prefer the public proto URL so both client and server use one source.
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_PROTO_URL || process.env.BACKEND_GRPC_URL || process.env.BACKEND_URL || 'http://192.168.117.66:3000';

const transport = createGrpcTransport({
  baseUrl: BACKEND_URL,
});

const authClient = createClient(AuthService, transport);

// Helper to refresh access token using centralized refresh logic
async function refreshAccessToken(): Promise<boolean> {
  try {
    const ok = await refreshTokens();
    if (ok) {
      console.log('[refreshAccessToken] refreshTokens() succeeded');
    } else {
      console.warn('[refreshAccessToken] refreshTokens() returned false');
    }
    return ok;
  } catch (err) {
    console.error('[refreshAccessToken] Error calling refreshTokens():', err);
    return false;
  }
}

// Helper to execute authenticated call with auto-retry on unauthenticated
async function executeWithRefresh<T>(
  operation: () => Promise<T>,
  retryOnce = true
): Promise<T> {
  try {
    return await operation();
  } catch (err) {
    // Check if error is unauthenticated (ConnectError code 16)
    const e = err as unknown as Record<string, unknown>;
    const code = e.code as number | undefined;
    const messageStr = (e.message as string | undefined) ?? (err instanceof Error ? err.message : '');
    const isUnauthenticated = code === 16 ||
                              messageStr.toLowerCase().includes('unauthenticated') ||
                              messageStr.toLowerCase().includes('authorization');
    
    if (isUnauthenticated && retryOnce) {
      console.log('[executeWithRefresh] Unauthenticated error, attempting refresh...');
      const refreshed = await refreshAccessToken();

      if (refreshed) {
        console.log('[executeWithRefresh] Refresh successful, retrying operation...');
        // Retry operation once (set retryOnce=false to prevent infinite loop)
        return executeWithRefresh(operation, false);
      } else {
        console.error('[executeWithRefresh] Refresh failed, clearing session and aborting');
        try {
          await deleteSession();
        } catch (e) {
          console.error('[executeWithRefresh] deleteSession failed:', e);
        }
        // Throw a clear error so callers can redirect to login
        throw new Error('SESSION_EXPIRED');
      }
    }

    throw err;
  }
}

// Create authenticated client with token in metadata
async function createAuthenticatedClient() {
  const token = await getAccessToken();
  console.log('[createAuthenticatedClient] Access token exists:', !!token);
  
  if (!token) {
    console.warn('[createAuthenticatedClient] No access token - will fail unless refreshed');
  }
  
  const authTransport = createGrpcTransport({
    baseUrl: BACKEND_URL,
    interceptors: [
      (next) => async (req) => {
        if (token) {
          req.header.set('authorization', `Bearer ${token}`);
        }
        return await next(req);
      },
    ],
  });
  
  return createClient(AuthService, authTransport);
}

// Result wrapper for success/error handling
export interface ProtoAuthResult {
  success: boolean;
  response?: LoginResponse | RegisterResponse;
  error?: string;
}

/**
 * Login via protobuf/Connect
 */
export async function protoLogin(email: string, password: string): Promise<ProtoAuthResult> {
  try {
    const request = create(LoginRequestSchema, { email, password });
    const response = await authClient.login(request);
    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Proto login failed';
    return { success: false, error: message };
  }
}

/**
 * Register via protobuf/Connect
 */
export async function protoRegister(payload: {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
}): Promise<ProtoAuthResult> {
  try {
    const request = create(RegisterRequestSchema, {
      email: payload.email,
      password: payload.password,
      fullName: payload.full_name,
      phone: payload.phone || '',
    });
    const response = await authClient.register(request);
    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Proto register failed';
    return { success: false, error: message };
  }
}

export { authClient, transport };

/**
 * MFA - Generate QR code and secret for 2FA setup
 */
export async function protoMfaGenerate(): Promise<{ success: boolean; response?: MfaGenerateResponse; error?: string }> {
  try {
    console.log('[protoMfaGenerate] Creating authenticated client...');
    
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedClient();
      const request = create(MfaGenerateRequestSchema, {});
      console.log('[protoMfaGenerate] Calling mfaGenerate...');
      return await client.mfaGenerate(request);
    });
    
    console.log('[protoMfaGenerate] Response:', response);
    return { success: true, response };
  } catch (err) {
    console.error('[protoMfaGenerate] Error:', err);
    let message = 'MFA generate failed';
    try {
      const e = err as unknown as Record<string, unknown>;
      const m = e.message ?? (err instanceof Error ? err.message : undefined);
      if (typeof m === 'string') message = m;
    } catch {}
    return { success: false, error: message };
  }
}

/**
 * MFA - Verify setup code (complete 2FA setup)
 */
export async function protoMfaVerify(code: string): Promise<{ success: boolean; response?: MfaVerifyResponse; error?: string }> {
  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedClient();
      const request = create(MfaVerifyRequestSchema, { code });
      return await client.mfaVerify(request);
    });
    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'MFA verify failed';
    return { success: false, error: message };
  }
}

/**
 * MFA - Validate code during login (after initial login returns mfa_required)
 */
export async function protoMfaValidate(mfaToken: string, code: string): Promise<{ success: boolean; response?: MfaValidateResponse; error?: string }> {
  try {
    const request = create(MfaValidateRequestSchema, { mfaToken, code });
    const response = await authClient.mfaValidate(request);
    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'MFA validate failed';
    return { success: false, error: message };
  }
}

/**
 * MFA - Disable 2FA (requires password and optional code)
 */
export async function protoMfaDisable(password: string, code?: string): Promise<{ success: boolean; response?: MfaDisableResponse; error?: string }> {
  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedClient();
      const request = create(MfaDisableRequestSchema, { password, code });
      return await client.mfaDisable(request);
    });
    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'MFA disable failed';
    return { success: false, error: message };
  }
}

/**
 * Get recovery codes for MFA
 */
export async function protoGetRecoveryCodes(): Promise<{ success: boolean; response?: GetRecoveryCodesResponse; error?: string }> {
  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedClient();
      const request = create(GetRecoveryCodesRequestSchema, {});
      return await client.getRecoveryCodes(request);
    });
    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Get recovery codes failed';
    return { success: false, error: message };
  }
}

/**
 * Refresh access token using refresh token
 */
export async function protoRefreshToken(refreshToken: string): Promise<{ success: boolean; response?: RefreshTokenResponse; error?: string }> {
  try {
    const request = create(RefreshTokenRequestSchema, { refreshToken });
    const response = await authClient.refreshToken(request);
    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Refresh token failed';
    return { success: false, error: message };
  }
}

/**
 * Get user profile (requires authentication)
 */
export async function protoGetProfile(): Promise<{ success: boolean; response?: GetProfileResponse; error?: string }> {
  try {
    console.log('[protoGetProfile] Creating authenticated client...');
    
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedClient();
      const request = create(GetProfileRequestSchema, {});
      console.log('[protoGetProfile] Calling getProfile...');
      return await client.getProfile(request);
    });
    
    console.log('[protoGetProfile] Response:', response);
    return { success: true, response };
  } catch (err) {
    console.error('[protoGetProfile] Error:', err);
    const message = err instanceof Error ? err.message : 'Get profile failed';
    return { success: false, error: message };
  }
}

/**
 * Update user profile (requires authentication)
 */
export async function protoUpdateProfile(data: {
  fullName?: string;
  email?: string;
  phone?: string;
}): Promise<{ success: boolean; response?: UpdateProfileResponse; error?: string }> {
  try {
    console.log('[protoUpdateProfile] Creating authenticated client...');
    console.log('[protoUpdateProfile] Creating request with data:', data);
    
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedClient();
      const request = create(UpdateProfileRequestSchema, {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
      });
      console.log('[protoUpdateProfile] Calling updateProfile...');
      return await client.updateProfile(request);
    });
    
    console.log('[protoUpdateProfile] Response:', response);
    return { success: true, response };
  } catch (err) {
    console.error('[protoUpdateProfile] Error:', err);
    const message = err instanceof Error ? err.message : 'Update profile failed';
    return { success: false, error: message };
  }
}

/**
 * Get user sessions
 */
export async function protoGetSessions(): Promise<{ success: boolean; response?: GetSessionsResponse; error?: string }> {
  try {
    console.log('[protoGetSessions] Creating authenticated client...');
    
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedClient();
      const request = create(GetSessionsRequestSchema, {});
      console.log('[protoGetSessions] Calling getSessions...');
      return await client.getSessions(request);
    });
    
    console.log('[protoGetSessions] Response:', response);
    return { success: true, response };
  } catch (err) {
    console.error('[protoGetSessions] Error:', err);
    const message = err instanceof Error ? err.message : 'Get sessions failed';
    return { success: false, error: message };
  }
}

/**
 * Revoke a specific session
 */
export async function protoRevokeSession(sessionId: string): Promise<{ success: boolean; response?: RevokeSessionResponse; error?: string }> {
  try {
    console.log('[protoRevokeSession] Creating authenticated client...');
    
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedClient();
      const request = create(RevokeSessionRequestSchema, { sessionId });
      console.log('[protoRevokeSession] Calling revokeSession for:', sessionId);
      return await client.revokeSession(request);
    });
    
    console.log('[protoRevokeSession] Response:', response);
    return { success: true, response };
  } catch (err) {
    console.error('[protoRevokeSession] Error:', err);
    const message = err instanceof Error ? err.message : 'Revoke session failed';
    return { success: false, error: message };
  }
}

/**
 * Revoke all other sessions (keep current session)
 */
export async function protoRevokeOtherSessions(): Promise<{ success: boolean; response?: RevokeOtherSessionsResponse; error?: string }> {
  try {
    console.log('[protoRevokeOtherSessions] Creating authenticated client...');
    
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedClient();
      const request = create(RevokeOtherSessionsRequestSchema, {});
      console.log('[protoRevokeOtherSessions] Calling revokeOtherSessions...');
      return await client.revokeOtherSessions(request);
    });
    
    console.log('[protoRevokeOtherSessions] Response:', response);
    return { success: true, response };
  } catch (err) {
    console.error('[protoRevokeOtherSessions] Error:', err);
    const message = err instanceof Error ? err.message : 'Revoke other sessions failed';
    return { success: false, error: message };
  }
}

/**
 * Verify email with token (no auth required)
 */
export async function protoVerifyEmail(token: string): Promise<{ success: boolean; response?: VerifyEmailResponse; error?: string }> {
  try {
    console.log('[protoVerifyEmail] Verifying email with token...');
    const request = create(VerifyEmailRequestSchema, { token });
    const response = await authClient.verifyEmail(request);
    console.log('[protoVerifyEmail] Response:', response);
    return { success: true, response };
  } catch (err) {
    const e = err as unknown as Record<string, unknown>;
    const code = e.code as number | undefined;
    const rawMessage = e.rawMessage as string | undefined;
    if (code === 16) {
      console.warn('[protoVerifyEmail] Invalid or expired token');
      return { success: false, error: rawMessage || 'Token không hợp lệ hoặc đã hết hạn' };
    }
    console.error('[protoVerifyEmail] Error:', err);
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

/**
 * Resend verification email (no auth required)
 */
export async function protoResendVerification(email: string): Promise<{ success: boolean; response?: ResendVerificationResponse; error?: string }> {
  try {
    console.log('[protoResendVerification] Resending verification to:', email);
    const request = create(ResendVerificationRequestSchema, { email });
    const response = await authClient.resendVerification(request);
    console.log('[protoResendVerification] Response:', response);
    return { success: true, response };
  } catch (err) {
    console.error('[protoResendVerification] Error:', err);
    const message = err instanceof Error ? err.message : 'Resend verification failed';
    return { success: false, error: message };
  }
}

/**
 * Forgot password (no auth required)
 */
export async function protoForgotPassword(email: string): Promise<{ success: boolean; response?: ForgotPasswordResponse; error?: string }> {
  try {
    console.log('[protoForgotPassword] Sending forgot password for:', email);
    const request = create(ForgotPasswordRequestSchema, { email });
    const response = await authClient.forgotPassword(request);
    console.log('[protoForgotPassword] Response:', response);
    return { success: true, response };
  } catch (err) {
    console.error('[protoForgotPassword] Error:', err);
    const message = err instanceof Error ? err.message : 'Forgot password failed';
    return { success: false, error: message };
  }
}

/**
 * Reset password (no auth required)
 */
export async function protoResetPassword(token: string, newPassword: string): Promise<{ success: boolean; response?: ResetPasswordResponse; error?: string }> {
  try {
    console.log('[protoResetPassword] Resetting password...');
    const request = create(ResetPasswordRequestSchema, { token, newPassword });
    const response = await authClient.resetPassword(request);
    console.log('[protoResetPassword] Response:', response);
    return { success: true, response };
  } catch (err) {
    console.error('[protoResetPassword] Error:', err);
    const message = err instanceof Error ? err.message : 'Reset password failed';
    return { success: false, error: message };
  }
}

/**
 * Delete account (requires auth)
 */
export async function protoDeleteAccount(password: string): Promise<{ success: boolean; response?: DeleteAccountResponse; error?: string }> {
  try {
    console.log('[protoDeleteAccount] Deleting account...');
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedClient();
      const request = create(DeleteAccountRequestSchema, { password });
      return await client.deleteAccount(request);
    });
    console.log('[protoDeleteAccount] Response:', response);
    return { success: true, response };
  } catch (err) {
    console.error('[protoDeleteAccount] Error:', err);
    const message = err instanceof Error ? err.message : 'Delete account failed';
    return { success: false, error: message };
  }
}

/**
 * Delete account (requires auth)
 */

