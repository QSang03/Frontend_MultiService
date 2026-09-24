'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Bell, Menu, Search, Building2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface B2BHeaderProps {
  onMenuToggle?: () => void;
  orgName?: string;
  isAdmin?: boolean;
}

const pageTitles: Record<string, string> = {
  '/customer/b2b/dashboard': 'Dashboard Tổng quan',
  '/customer/b2b/tickets': 'Quản lý Yêu cầu',
  '/customer/b2b/tickets/new': 'Tạo Yêu cầu Mới',
  '/customer/b2b/approvals': 'Chờ Phê duyệt',
  '/customer/b2b/members': 'Quản lý Thành viên',
  '/customer/b2b/assets': 'Quản lý Tài sản',
  '/customer/b2b/contracts': 'Hợp đồng',
  '/customer/b2b/chat': 'Tin nhắn',
  '/customer/b2b/reports': 'Báo cáo & Thống kê',
  '/customer/b2b/audit-log': 'Nhật ký Hệ thống',
  '/customer/b2b/notifications': 'Thông báo',
  '/customer/b2b/settings/approval': 'Cài đặt Phê duyệt',
  '/customer/b2b/settings/cost-center': 'Cost Center & Ngân sách',
  '/customer/b2b/settings/delegation': 'Ủy quyền',
  '/customer/b2b/settings/organization': 'Cài đặt Tổ chức',
};

export default function B2BHeader({ onMenuToggle, orgName = 'ABC Corporation', isAdmin = false }: B2BHeaderProps) {
  const pathname = usePathname() ?? '';
  const { user } = useAuth();

  const title = pageTitles[pathname] || 'Dashboard';
  const initials = user?.full_name
    ? user.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'AD';

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-200">
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
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Building2 className="w-3 h-3" />
              <span>{orgName}</span>
              {isAdmin && (
                <span className="ml-1 px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold uppercase">
                  Admin
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm ticket, tài sản..."
              className="bg-transparent border-none outline-none text-sm text-gray-600 w-48 placeholder:text-gray-400"
            />
          </div>
          <button className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-[#0f172a] rounded-full flex items-center justify-center text-white text-sm font-bold">
              {initials}
            </div>
            <div className="hidden lg:block">
              <p className="text-sm font-medium text-gray-900">{user?.full_name || 'Admin User'}</p>
              <p className="text-xs text-gray-500">{isAdmin ? 'Quản trị viên' : 'Thành viên'}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
