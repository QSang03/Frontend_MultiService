'use server';

import { protoVerifyEmail } from '@/lib/proto/auth-client';

export interface VerifyEmailResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Verify email with token from URL
 */
export async function verifyEmail(token: string): Promise<VerifyEmailResult> {
  try {
    if (!token) {
      return { success: false, error: 'Token không hợp lệ' };
    }

    const result = await protoVerifyEmail(token);

    if (!result.success || !result.response) {
      return {
        success: false,
        error: result.error || 'Xác thực email thất bại',
      };
    }

    return {
      success: result.response.success,
      message: result.response.message,
      error: !result.response.success ? result.response.message : undefined,
    };
  } catch (err) {
    console.error('[verifyEmail] Error:', err);
    const message = err instanceof Error ? err.message : 'Xác thực email thất bại';
    return { success: false, error: message };
  }
}
