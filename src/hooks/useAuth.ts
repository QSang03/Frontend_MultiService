'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { login as loginAction, logout as logoutAction, register as registerAction } from '@/app/actions/auth';
import { useToast } from '@/components/ui';
import { STORAGE_KEYS, getDashboardByRole } from '@/constants';
import type { User, LoginRequest, RegisterRequest } from '@/types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
        if (storedUser) {
           try {
             setUser(JSON.parse(storedUser));
             setIsAuthenticated(true);
           } catch {
             localStorage.removeItem(STORAGE_KEYS.USER);
           }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = useCallback(async (data: LoginRequest) => {
    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append('email', data.email);
      formData.append('password', data.password);

      const result = await loginAction(null, formData);

      console.log('[useAuth] Login result:', result);

      if (result.success && result.user) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(result.user));
        setUser(result.user as User);
        setIsAuthenticated(true);
        // Redirect based on user role (hard redirect to avoid stuck state)
        const dashboard = getDashboardByRole(String((result.user as User).role));
        console.log('[useAuth] Redirecting to:', dashboard, 'for role:', (result.user as User).role);
        router.push(dashboard);
        if (typeof window !== 'undefined') {
          window.location.replace(dashboard);
        }
        return { success: true };
      }

      // Check if MFA required
      const maybe = result as unknown as Record<string, unknown>;
      if (maybe.mfa_required) {
        console.log('[useAuth] MFA required, returning to LoginForm');
        return result; // Return mfa_required flag to LoginForm
      }

      const errorMessage = result.error || 'Đăng nhập thất bại';
      console.error('[useAuth] Login failed:', errorMessage);
      return { success: false, error: errorMessage };

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Đăng nhập thất bại';
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const toast = useToast();

  const register = useCallback(async (data: RegisterRequest) => {
    try {
      setIsLoading(true);

      const formData = new FormData();
      formData.append('email', data.email);
      formData.append('password', data.password);
      formData.append('full_name', data.name);
      if (data.phone) {
        formData.append('phone', data.phone);
      }
      // Organization fields (business registration)
      const org = (data as RegisterRequest).organization;
      if (org) {
        if (org.name) formData.append('organization[name]', org.name);
        if (org.tax_code) formData.append('organization[tax_code]', org.tax_code);
        if (org.address) formData.append('organization[address]', org.address);
      }

      const result = await registerAction(null, formData);

      // Return result to the caller so the component can show a toast and handle the 2s delay
      if (result.success) {
        return { success: true };
      }

      return { success: false, error: result.error || 'Đăng ký thất bại' };

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Đăng ký thất bại';
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    // Use toast from context if available
    try {
      if (toast && toast.addToast) toast.addToast('Đang đăng xuất...', { type: 'info', duration: 1000 });
    } catch {}

    try {
      await logoutAction();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem(STORAGE_KEYS.USER);
      setUser(null);
      setIsAuthenticated(false);
      setTimeout(() => {
        router.push('/login');
      }, 1000);
    }
  }, [router, toast]);

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
  };
}
