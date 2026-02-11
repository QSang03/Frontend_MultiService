'use server';

import {
  protoMfaGenerate,
  protoMfaVerify,
  protoMfaValidate,
  protoMfaDisable,
  protoGetRecoveryCodes,
} from '@/lib/proto/auth-client';
import { createSessionWithTokens } from '@/lib/auth/session';

const USE_PROTOBUF = process.env.NEXT_PUBLIC_USE_PROTOBUF === 'true';

/**
 * Generate MFA setup (QR code + secret)
 */
export async function generateMfa() {
  if (!USE_PROTOBUF) {
    return { error: 'MFA only available via protobuf' };
  }

  try {
    const result = await protoMfaGenerate();

    if (result.success && result.response) {
      return {
        success: true,
        secret: result.response.secret,
        qrCode: result.response.qrCode,
      };
    }

    return { error: result.error || 'Failed to generate MFA' };
  } catch (error) {
    console.error('Generate MFA error:', error);
    return { error: 'Đã có lỗi xảy ra' };
  }
}

/**
 * Verify MFA setup code (complete 2FA setup)
 */
export async function verifyMfaSetup(code: string) {
  if (!USE_PROTOBUF) {
    return { error: 'MFA only available via protobuf' };
  }

  try {
    const result = await protoMfaVerify(code);

    if (result.success && result.response) {
      return {
        success: result.response.success,
        message: result.response.message,
      };
    }

    return { error: result.error || 'Failed to verify MFA' };
  } catch (error) {
    console.error('Verify MFA error:', error);
    return { error: 'Mã xác thực không đúng' };
  }
}

/**
 * Validate MFA code during login
 */
export async function validateMfaLogin(mfaToken: string, code: string) {
  if (!USE_PROTOBUF) {
    return { error: 'MFA only available via protobuf' };
  }

  try {
    const result = await protoMfaValidate(mfaToken, code);

    if (result.success && result.response) {
      const res = result.response;

      // If validation successful and tokens provided, create session
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

        return {
          success: true,
          user: {
            id: res.user.id,
            email: res.user.email,
            name: res.user.fullName || res.user.email,
            role: res.user.role !== undefined ? String(res.user.role) : undefined,
          },
        };
      }

      // Still requires MFA (shouldn't happen, but handle it)
      if (res.mfaRequired) {
        return { error: 'MFA validation incomplete' };
      }
    }

    return { error: result.error || 'MFA validation failed' };
  } catch (error) {
    console.error('Validate MFA error:', error);
    return { error: 'Mã xác thực không đúng' };
  }
}

/**
 * Disable MFA
 */
export async function disableMfa(password: string, code?: string) {
  if (!USE_PROTOBUF) {
    return { error: 'MFA only available via protobuf' };
  }

  try {
    const result = await protoMfaDisable(password, code);

    if (result.success && result.response) {
      return {
        success: result.response.success,
        message: result.response.message,
      };
    }

    return { error: result.error || 'Failed to disable MFA' };
  } catch (error) {
    console.error('Disable MFA error:', error);
    return { error: 'Không thể tắt MFA' };
  }
}

/**
 * Get recovery codes
 */
export async function getRecoveryCodes() {
  if (!USE_PROTOBUF) {
    return { error: 'MFA only available via protobuf' };
  }

  try {
    const result = await protoGetRecoveryCodes();

    if (result.success && result.response) {
      return {
        success: true,
        codes: result.response.codes || [],
      };
    }

    return { error: result.error || 'Failed to get recovery codes' };
  } catch (error) {
    console.error('Get recovery codes error:', error);
    return { error: 'Không thể lấy mã khôi phục' };
  }
}
