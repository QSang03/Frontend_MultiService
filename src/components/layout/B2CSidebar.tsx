'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  ClipboardList,
  MessageCircle,
  CreditCard,
  User,
  Bell,
  LogOut,
  X,
} from 'lucide-react';
import { cn } from '@/utils';
import { useAuth } from '@/hooks/useAuth';

interface B2CSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const menuItems = [
  { icon: Home, label: 'Trang chủ', href: '/customer/b2c/dashboard' },
  { icon: ClipboardList, label: 'Yêu cầu của tôi', href: '/customer/b2c/tickets' },
  { icon: MessageCircle, label: 'Tin nhắn', href: '/customer/b2c/chat' },
  { icon: CreditCard, label: 'Thanh toán', href: '/customer/b2c/payments' },
  { icon: User, label: 'Hồ sơ cá nhân', href: '/customer/b2c/profile' },
  { icon: Bell, label: 'Thông báo', href: '/customer/b2c/notifications' },
];

export default function B2CSidebar({ isOpen = false, onClose }: B2CSidebarProps) {
  const pathname = usePathname() ?? '';
  const { logout } = useAuth();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen w-64 bg-white border-r border-gray-200 text-gray-800 flex flex-col transition-transform duration-200',
        'lg:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center font-bold text-lg text-white">
            M
          </div>
          <div>
            <h1 className="font-bold text-lg text-gray-900">MultiService</h1>
            <p className="text-xs text-blue-500 font-medium">KHÁCH HÀNG</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-1 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Đóng menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'bg-blue-50 text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
              <span>{item.label}</span>
              {item.label === 'Thông báo' && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  3
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Sign Out */}
      <div className="px-4 py-4 border-t border-gray-100">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all w-full"
        >
          <LogOut className="w-5 h-5" aria-hidden="true" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}
