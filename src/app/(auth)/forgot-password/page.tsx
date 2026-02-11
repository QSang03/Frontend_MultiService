'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardBody, Button, Input } from '@/components/ui';
import { APP_NAME } from '@/constants';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch('/api/auth/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage(data.message || 'Nếu email tồn tại, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu');
      } else {
        setError(data.message || 'Yêu cầu thất bại');
      }
    } catch {
      setError('Lỗi mạng. Vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card variant="elevated" className="w-full max-w-md">
        <CardHeader className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">{APP_NAME}</h1>
          <p className="mt-2 text-gray-600">Quên mật khẩu</p>
        </CardHeader>
        <CardBody>
          {message ? (
            <div className="text-center py-8">
              <p className="text-gray-700 mb-4">{message}</p>
              <Link href="/login">
                <Button variant="primary" className="w-full">Quay lại đăng nhập</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{error}</div>}

              <Input
                label="Email"
                type="email"
                name="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Button type="submit" className="w-full" isLoading={loading}>
                Gửi hướng dẫn đặt lại mật khẩu
              </Button>

              <div className="text-sm text-center text-gray-600">
                <Link href="/register" className="text-blue-600 hover:text-blue-700">Đăng ký tài khoản mới</Link>
              </div>
            </form>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
