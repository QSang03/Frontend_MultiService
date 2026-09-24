'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Bell, Menu } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface B2CHeaderProps {
  onMenuToggle?: () => void;
}

const pageTitles: Record<string, string> = {
  '/customer/b2c/dashboard': 'Trang chủ',
  '/customer/b2c/tickets': 'Yêu cầu của tôi',
  '/customer/b2c/tickets/new': 'Tạo yêu cầu mới',
  '/customer/b2c/chat': 'Tin nhắn',
  '/customer/b2c/payments': 'Thanh toán',
  '/customer/b2c/profile': 'Hồ sơ cá nhân',
  '/customer/b2c/notifications': 'Thông báo',
};

export default function B2CHeader({ onMenuToggle }: B2CHeaderProps) {
  const pathname = usePathname() ?? '';
  const { user } = useAuth();

  const title = pageTitles[pathname] || 'Trang chủ';
  const initials = user?.full_name
    ? user.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'KH';

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="flex items-center justify-between px-4 lg:px-8 h-16">
        {/* Left */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Mở menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          <div className="w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
}
