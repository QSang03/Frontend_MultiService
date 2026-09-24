'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Menu } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { decodeRole } from '@/utils';

const pageTitleMap: Record<string, string> = {
  dashboard:  'Dashboard',
  customers:  'CRM & Leads',
  quotations: 'Báo giá & Hợp đồng',
  support:    'Hỗ trợ & Theo dõi',
  revenue:    'Thanh toán & Hóa đơn',
  contracts:  'Hoa hồng',
  profile:    'Hồ sơ cá nhân',
  orders:     'Quản lý đơn hàng',
};

interface SaleHeaderProps {
  onMenuToggle?: () => void;
}

export default function SaleHeader({ onMenuToggle }: SaleHeaderProps) {
  const { user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const notifRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname() ?? '';

  const segments = pathname.split('/').filter(Boolean);
  const currentSegment = segments[segments.length - 1] ?? '';
  const pageTitle = pageTitleMap[currentSegment] ?? currentSegment;

  const initials = useMemo(() => {
    return (user?.name || 'AS').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
  }, [user?.name]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header translate="no" className="notranslate h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-3">
        {/* Hamburger – only on mobile */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Mở menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold text-gray-900">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setNotifOpen((v) => !v); setUserMenuOpen(false); }}
            className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
            aria-label="Thông báo"
            aria-haspopup="true"
            aria-expanded={notifOpen}
          >
            <Bell className="w-5 h-5" />
          </button>

          {notifOpen && (
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Bảng thông báo"
              className="absolute right-0 mt-2 w-72 bg-white border border-gray-100 rounded-xl shadow-lg z-50 overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-900">Thông báo</p>
              </div>
              <div className="py-8 flex flex-col items-center justify-center gap-2 text-center">
                <Bell className="w-8 h-8 text-gray-200" />
                <p className="text-sm text-gray-500">Chưa có thông báo nào</p>
              </div>
            </div>
          )}
        </div>

        {/* User Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => { setUserMenuOpen((s) => !s); setNotifOpen(false); }}
            className="flex items-center gap-3 px-3 py-1 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
            aria-haspopup="true"
            aria-expanded={userMenuOpen}
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">
                {user?.name || 'Nhân viên Sale'}
              </p>
              <p className="text-xs text-gray-500">
                {decodeRole(user?.role)}
              </p>
            </div>
            <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {initials}
            </div>
          </button>

          {userMenuOpen && (
            <div
              role="dialog"
              aria-modal="true"
              className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-lg z-50"
            >
              <div className="p-4 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-900 truncate">{user?.name || 'Nhân viên Sale'}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
              </div>
              <div className="p-2">
                <Link
                  href="/sale/profile"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Hồ sơ của tôi
                </Link>
                <button
                  onClick={() => { setUserMenuOpen(false); logout(); }}
                  className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Đăng xuất
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
