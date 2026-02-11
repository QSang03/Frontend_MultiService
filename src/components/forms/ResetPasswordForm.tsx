'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button, Input } from '@/components/ui';

type Props = {
  token: string;
};

export default function ResetPasswordForm({ token }: Props) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!password) {
      setError('Vui lòng nhập mật khẩu mới');
      return;
    }
    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage(data.message || 'Đặt lại mật khẩu thành công');
      } else {
        setError(data.message || 'Đặt lại mật khẩu thất bại');
      }
    } catch {
      setError('Lỗi mạng. Vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  if (message) {
    return (
      <div className="text-center py-6">
        <p className="text-gray-700 mb-4">{message}</p>
        <Link href="/login">
          <Button variant="primary" className="w-full">Đăng nhập</Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{error}</div>}

      <Input
        label="Mật khẩu mới"
        type="password"
        name="password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <Input
        label="Xác nhận mật khẩu"
        type="password"
        name="confirmPassword"
        placeholder="••••••••"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />

      <Button type="submit" className="w-full" isLoading={loading}>
        Đặt lại mật khẩu
      </Button>
    </form>
  );
}
