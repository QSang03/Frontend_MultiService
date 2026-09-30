import Link from 'next/link';
import React from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui';
import { APP_NAME } from '@/constants';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card variant="elevated" className="w-full max-w-md">
        <CardHeader className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">{APP_NAME}</h1>
          <p className="mt-2 text-gray-600">Chọn loại tài khoản muốn đăng ký</p>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <Link href="/register/personal" className="block w-full text-center bg-white border hover:shadow px-4 py-3 rounded">
              Đăng ký cá nhân
            </Link>

            <Link href="/register/business" className="block w-full text-center bg-white border hover:shadow px-4 py-3 rounded">
              Đăng ký doanh nghiệp (B2B)
            </Link>

            <Link href="/register/provider" className="block w-full text-center bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-semibold px-4 py-3 rounded">
              Đăng ký Đối tác Kỹ thuật (Service Provider)
            </Link>

            <div className="text-sm text-center text-gray-600">
              Chọn &quot;Đăng ký doanh nghiệp&quot; để thiết lập Workspace B2B, hoặc &quot;Đối tác Kỹ thuật&quot; để cung cấp dịch vụ trên nền tảng.
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
