'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { STORAGE_KEYS, getDashboardByRole } from '@/constants';
import LoginForm from './LoginForm';

export default function LoginFormClient() {
  const router = useRouter();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER);
      if (stored) {
        const user = JSON.parse(stored);
        if (user && user.role) {
          const target = getDashboardByRole(user.role);
          router.replace(target);
        }
      }
    } catch {
      // ignore
    }
  }, [router]);

  return <LoginForm />;
}
