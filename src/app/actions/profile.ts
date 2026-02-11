'use server';

import { protoGetProfile, protoUpdateProfile, protoDeleteAccount } from '@/lib/proto/auth-client';
import type { User } from '@/types';
import serverApiClient from '@/lib/api/server-client';

const USE_PROTOBUF = process.env.NEXT_PUBLIC_USE_PROTOBUF === 'true';

export async function getProfile(): Promise<{
  success: boolean;
  data?: User;
  error?: string;
}> {
  if (!USE_PROTOBUF) {
    return { success: false, error: 'Protobuf not enabled' };
  }

  try {
    const result = await protoGetProfile();

    if (!result.success || !result.response?.profile) {
      return {
        success: false,
        error: result.error || 'Không thể lấy thông tin profile',
      };
    }

    const profile = result.response.profile;

    // Map UserProfile proto to User type
    const user: User = {
      id: profile.id,
      email: profile.email,
      name: profile.fullName,
      full_name: profile.fullName,
      phone: profile.phone,
      role: profile.role, // UserRole enum number
      organizationId: profile.organizationId,
      avatar_url: profile.avatarUrl,
      createdAt: profile.createdAt ? new Date(Number(profile.createdAt.seconds) * 1000) : new Date(),
      updatedAt: new Date(),
      mfa_enabled: profile.mfaEnabled, // Now available in generated types!
    };

    return { success: true, data: user };
  } catch (err) {
    console.error('Get profile error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Lỗi khi lấy thông tin',
    };
  }
}

export async function updateProfile(data: {
  full_name?: string;
  email?: string;
  phone?: string;
}): Promise<{
  success: boolean;
  data?: User;
  error?: string;
}> {
  if (!USE_PROTOBUF) {
    return { success: false, error: 'Protobuf not enabled' };
  }

  try {
    const result = await protoUpdateProfile({
      fullName: data.full_name,
      email: data.email,
      phone: data.phone,
    });

    if (!result.success || !result.response?.profile) {
      return {
        success: false,
        error: result.error || 'Cập nhật thất bại',
      };
    }

    const profile = result.response.profile;

    // Map UserProfile proto to User type
    const user: User = {
      id: profile.id,
      email: profile.email,
      name: profile.fullName,
      full_name: profile.fullName,
      phone: profile.phone,
      role: profile.role, // UserRole enum number
      organizationId: profile.organizationId,
      avatar_url: profile.avatarUrl,
      createdAt: profile.createdAt ? new Date(Number(profile.createdAt.seconds) * 1000) : new Date(),
      updatedAt: new Date(),
      // Read MFA flag from proto — support both camelCase and snake_case generated names
        mfa_enabled: (() => {
          const p = profile as unknown as Record<string, unknown>;
          const flag = p.mfaEnabled ?? p.mfa_enabled ?? false;
          return Boolean(flag);
        })(),
    };

    return { success: true, data: user };
  } catch (err) {
    console.error('Update profile error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Lỗi khi cập nhật',
    };
  }
}

export async function deleteAccount(password: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    if (USE_PROTOBUF) {
      const result = await protoDeleteAccount(password);
      if (result.success && result.response) {
        return { success: result.response.success, message: result.response.message };
      }
      // If proto fails, fall through to REST fallback
    }

    // REST fallback
    try {
      const res = await serverApiClient.post('/auth/delete', { password });
      if (res?.data) {
        return { success: !!res.data.success, message: res.data.message };
      }
    } catch (err) {
      const e = err as unknown as Record<string, unknown>;
      const resp = e.response as Record<string, unknown> | undefined;
      const status = resp?.status as number | undefined;
      if (status === 404) {
        const res = await serverApiClient.post('/v1/auth/delete', { password });
        if (res?.data) {
          return { success: !!res.data.success, message: res.data.message };
        }
      } else {
        throw err;
      }
    }

    return { success: false, error: 'Không nhận được phản hồi từ server' };
  } catch (err) {
    console.error('Delete account error:', err);
    let message = 'Xóa tài khoản thất bại';
    try {
      const e = err as unknown as Record<string, unknown>;
      const resp = e.response as Record<string, unknown> | undefined;
      const data = resp?.data as Record<string, unknown> | undefined;
      const msg = data?.message ?? e.message;
      if (typeof msg === 'string') message = msg;
      else if (err instanceof Error) message = err.message;
      else message = String(err);
    } catch {
      if (err instanceof Error) message = err.message;
      else message = String(err);
    }
    return { success: false, error: message };
  }
}
