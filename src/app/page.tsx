'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { STORAGE_KEYS, getDashboardByRole } from '@/constants';

function getUserRole(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.USER);
    if (stored) {
      const user = JSON.parse(stored);
      return user.role as string | undefined;
    }
  } catch {
    // ignore
  }
  return undefined;
}

export default function PortalSelectionPage() {
  const router = useRouter();

  useEffect(() => {
    const role = getUserRole();
    console.log('[PortalPage] User role from localStorage:', role);
    
    // Auto-redirect all users to their assigned portal based on role
    if (role) {
      const dashboard = getDashboardByRole(role);
      console.log('[PortalPage] Redirecting to:', dashboard);
      router.replace(dashboard);
    } else {
      // No role found, redirect to login
      console.log('[PortalPage] No role found, redirecting to login');
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center font-bold text-2xl text-white shadow-lg mx-auto mb-4 animate-pulse">
          M
        </div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Đang chuyển hướng...</h2>
        <p className="text-gray-500">Vui lòng đợi trong giây lát</p>
      </div>
    </div>
  );
}
