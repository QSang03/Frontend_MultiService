'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileText,
  Headphones,
  CreditCard,
  DollarSign,
  LogOut,
  X,
} from 'lucide-react';
import { cn } from '@/utils';
import { useAuth } from '@/hooks/useAuth';

interface SaleSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard',              href: '/sale/dashboard' },
  { icon: Users,           label: 'CRM & Leads',            href: '/sale/customers' },
  { icon: FileText,        label: 'Báo giá & Hợp đồng',    href: '/sale/quotations' },
  { icon: Headphones,      label: 'Hỗ trợ & Theo dõi',     href: '/sale/support' },
  { icon: CreditCard,      label: 'Thanh toán & Hóa đơn',  href: '/sale/revenue' },
  { icon: DollarSign,      label: 'Hoa hồng',               href: '/sale/contracts' },
];

export default function SaleSidebar({ isOpen = false, onClose }: SaleSidebarProps) {
  const pathname = usePathname() ?? '';
  const { logout } = useAuth();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen w-64 bg-[#1e2a4a] text-white flex flex-col transition-transform duration-200',
        // Desktop: always visible; Mobile: slide in/out
        'lg:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-lg">
            M
          </div>
          <div>
            <h1 className="font-bold text-lg">MultiService</h1>
            <p className="text-xs text-gray-400">SALE PORTAL</p>
          </div>
        </div>
        {/* Close button – only visible on mobile */}
        <button
          onClick={onClose}
          className="lg:hidden p-1 text-gray-400 hover:text-white transition-colors"
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
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-white/10 hover:text-white'
              )}
            >
              <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Sign Out */}
      <div className="px-4 py-4 border-t border-white/10">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-all w-full"
        >
          <LogOut className="w-5 h-5" aria-hidden="true" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}
