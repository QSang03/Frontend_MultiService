'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { STORAGE_KEYS, getDashboardByRole } from '@/constants';
import React from 'react';

const LoginForm = dynamic(() => import('./LoginForm'), { ssr: false });

export default function LoginFormClient(props: React.ComponentProps<typeof LoginForm>) {
  const router = useRouter();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER);
      if (stored) {
        const user = JSON.parse(stored);
        const target = getDashboardByRole(user?.role);
        router.replace(target);
      }
    } catch {
      // ignore
    }
  }, [router]);

  return <LoginForm {...props} />;
}
