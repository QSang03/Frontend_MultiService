"use client";

import { useState, useEffect, useCallback } from 'react';
import { getProfile as getProfileAction, updateProfile as updateProfileAction } from '@/app/actions/profile';
import type { User } from '@/types';

const USE_PROTOBUF = process.env.NEXT_PUBLIC_USE_PROTOBUF === 'true';

export function useProfile() {
  const [profile, setProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    console.log('useProfile: fetchProfile called, USE_PROTOBUF =', USE_PROTOBUF);
    setIsLoading(true);
    setError(null);
    try {
      if (USE_PROTOBUF) {
        console.log('useProfile: Using protobuf');
        // Use protobuf server action
        const res = await getProfileAction();
        console.log('useProfile: Proto response:', res);
        if (res.success && res.data) {
          setProfile(res.data);
        } else {
          if (res.error === 'SESSION_EXPIRED') {
            // Force client to login when both access and refresh tokens expired
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
            return;
          }
          setError(res.error || 'Không thể lấy thông tin');
        }
      } else {
        console.log('useProfile: Using HTTP');
        // Fallback to HTTP API
        const { userApi } = await import('@/services/api');
        const res = await userApi.getProfile();
        console.log('useProfile: HTTP response:', res);
        if (res.success && res.data) {
          setProfile(res.data);
        } else {
          setError(res.error || 'Không thể lấy thông tin');
        }
      }
    } catch (err) {
      console.error('useProfile: Error:', err);
      const msg = (err as Error)?.message || '';
      if (msg === 'SESSION_EXPIRED') {
        if (typeof window !== 'undefined') window.location.href = '/login';
        return;
      }
      setError(msg || 'Lỗi khi lấy thông tin');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (data: Partial<User>) => {
    setIsLoading(true);
    setError(null);
    try {
      if (USE_PROTOBUF) {
        // Use protobuf server action
        const res = await updateProfileAction({
          full_name: data.full_name || data.name,
          email: data.email,
          phone: data.phone,
        });
        if (res.success && res.data) {
          setProfile(res.data);
          return { success: true, data: res.data };
        }
        return { success: false, error: res.error || 'Cập nhật thất bại' };
      } else {
        // Fallback to HTTP API
        const { userApi } = await import('@/services/api');
        const res = await userApi.updateProfile(data);
        if (res.success && res.data) {
          setProfile(res.data);
          return { success: true, data: res.data };
        }
        return { success: false, error: res.error || 'Cập nhật thất bại' };
      }
      } catch (err) {
      const msg = (err as Error)?.message || '';
      if (msg === 'SESSION_EXPIRED') {
        if (typeof window !== 'undefined') window.location.href = '/login';
        return { success: false, error: 'SESSION_EXPIRED' };
      }
      return { success: false, error: msg || 'Cập nhật thất bại' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    isLoading,
    error,
    fetchProfile,
    updateProfile,
  } as const;
}
