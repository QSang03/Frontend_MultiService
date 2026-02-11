'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui';
import { Button, Input } from '@/components/ui';
import { Card, CardHeader, CardBody } from '@/components/ui';
import { ROUTES, APP_NAME } from '@/constants';
import { isValidEmail, isValidPhone } from '@/utils';

type RegisterMode = 'personal' | 'business';

type Props = {
  mode?: RegisterMode;
};

export default function RegisterForm({ mode = 'personal' }: Props) {
  const { register, isLoading } = useAuth();
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    // organization fields (business mode)
    organizationName: '',
    organizationTaxCode: '',
    organizationAddress: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [resendLoading, setResendLoading] = useState(false);
  const toast = useToast();

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Vui lòng nhập họ tên';
    }

    if (!formData.email) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (formData.phone && !isValidPhone(formData.phone)) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
    }

    if (!formData.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Mật khẩu phải chứa ký tự hoa, ký tự thường và chữ số';
    }

    if (mode === 'business') {
      if (!formData.organizationName?.trim()) {
        newErrors.organizationName = 'Vui lòng nhập tên doanh nghiệp';
      }
      if (!formData.organizationTaxCode?.trim()) {
        newErrors.organizationTaxCode = 'Vui lòng nhập mã số thuế';
      }
      if (!formData.organizationAddress?.trim()) {
        newErrors.organizationAddress = 'Vui lòng nhập địa chỉ doanh nghiệp';
      }
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const result = await register({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      phone: formData.phone || undefined,
      organization: mode === 'business' ? {
        name: formData.organizationName || undefined,
        tax_code: formData.organizationTaxCode || undefined,
        address: formData.organizationAddress || undefined,
      } : undefined,
    });

    if (!result.success) {
      setErrors({ general: result.error || 'Đăng ký thất bại' });
      return;
    }

    // Success: show check email UI
    setErrors({});
    setRegisteredEmail(formData.email);
  };

  // Show "Check your email" UI after successful registration
  if (registeredEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card variant="elevated" className="w-full max-w-md">
          <CardHeader className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">{APP_NAME}</h1>
            <p className="mt-2 text-gray-600">Xác thực tài khoản</p>
          </CardHeader>
          <CardBody>
            <div className="text-center py-6">
              {/* Email Icon */}
              <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>

              <h2 className="text-xl font-semibold text-gray-900 mb-2">Kiểm tra email của bạn</h2>

              <p className="text-gray-600 mb-4">
                Chúng tôi đã gửi một email xác thực đến:
              </p>

              <p className="font-medium text-blue-600 mb-6 break-all">
                {registeredEmail}
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left mb-6">
                <h4 className="font-semibold text-blue-900 text-sm mb-2">📧 Hướng dẫn:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                  <li>Mở hộp thư email của bạn</li>
                  <li>Tìm email từ {APP_NAME}</li>
                  <li>Bấm vào link xác thực trong email</li>
                  <li>Sau khi xác thực, bạn có thể đăng nhập</li>
                </ol>
              </div>

              <div className="text-sm text-gray-500 mb-6">
                <p>Không nhận được email?</p>
                <p>Kiểm tra thư mục spam hoặc thử đăng ký lại sau vài phút.</p>
              </div>

              <div className="mb-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={async () => {
                    if (!registeredEmail) return;
                    setResendLoading(true);
                    try {
                      const res = await fetch('/api/auth/resend', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: registeredEmail }),
                      });
                      const data = await res.json().catch(() => ({}));
                      if (res.ok) {
                        toast.addToast(data.message || 'Email đã được gửi lại', { type: 'success' });
                      } else {
                        toast.addToast(data.message || 'Không thể gửi lại email', { type: 'error' });
                      }
                    } catch {
                      toast.addToast('Lỗi mạng. Vui lòng thử lại', { type: 'error' });
                    } finally {
                      setResendLoading(false);
                    }
                  }}
                  isLoading={resendLoading}
                >
                  Gửi lại email xác thực
                </Button>
              </div>

              <div className="space-y-3">
                <Link href="/login">
                  <Button variant="primary" className="w-full">
                    Đã xác thực? Đăng nhập ngay
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setRegisteredEmail(null)}
                >
                  Đăng ký với email khác
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card variant="elevated" className="w-full max-w-md">
        <CardHeader className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">{APP_NAME}</h1>
          <p className="mt-2 text-gray-600">Tạo tài khoản mới</p>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.general && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                {errors.general}
              </div>
            )}

            <Input
              label="Họ và tên"
              name="name"
              type="text"
              placeholder="Nguyễn Văn A"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              leftIcon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
            />

            {mode === 'business' && (
              <>
                <Input
                  label="Tên doanh nghiệp"
                  name="organizationName"
                  type="text"
                  placeholder="Công ty TNHH ABC"
                  value={formData.organizationName}
                  onChange={handleChange}
                  error={errors.organizationName}
                />

                <Input
                  label="Mã số thuế"
                  name="organizationTaxCode"
                  type="text"
                  placeholder="0123456789"
                  value={formData.organizationTaxCode}
                  onChange={handleChange}
                  error={errors.organizationTaxCode}
                />

                <Input
                  label="Địa chỉ doanh nghiệp"
                  name="organizationAddress"
                  type="text"
                  placeholder="Số 1, Đường X, Quận Y"
                  value={formData.organizationAddress}
                  onChange={handleChange}
                  error={errors.organizationAddress}
                />
              </>
            )}

            <Input
              label="Email"
              name="email"
              type="email"
              placeholder="example@email.com"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              leftIcon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
            />

            <Input
              label="Số điện thoại (tùy chọn)"
              name="phone"
              type="tel"
              placeholder="0123 456 789"
              value={formData.phone}
              onChange={handleChange}
              error={errors.phone}
              leftIcon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              }
            />

            <Input
              label="Mật khẩu"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              leftIcon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
              rightIcon={
                <button type="button" onClick={() => setShowPassword((s) => !s)} className="p-1 focus:outline-none">
                  {showPassword ? (
                    <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10a9.96 9.96 0 012.252-6.023M6.17 6.17A9.956 9.956 0 0112 3c5.523 0 10 4.477 10 10 0 1.657-.372 3.223-1.032 4.626M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              }
            />

            <Input
              label="Xác nhận mật khẩu"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              leftIcon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              }
              rightIcon={
                <button type="button" onClick={() => setShowConfirmPassword((s) => !s)} className="p-1 focus:outline-none">
                  {showConfirmPassword ? (
                    <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10a9.96 9.96 0 012.252-6.023M6.17 6.17A9.956 9.956 0 0112 3c5.523 0 10 4.477 10 10 0 1.657-.372 3.223-1.032 4.626M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              }
            />

            <div className="pt-2">
              <Button type="submit" className="w-full" isLoading={isLoading}>
                Đăng ký
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Đã có tài khoản?{' '}
              <Link href={ROUTES.LOGIN} className="text-blue-600 hover:text-blue-700 font-medium">
                Đăng nhập
              </Link>
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
