'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ClipboardList,
  MessageCircle,
  Monitor,
  FileText,
  BarChart3,
  Users,
  Settings,
  Bell,
  LogOut,
  X,
  Wallet,
  Building2,
  ScrollText,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/utils';
import { useAuth } from '@/hooks/useAuth';

interface B2BSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isAdmin?: boolean;
}

interface MenuItem {
  icon: React.ElementType;
  label: string;
  href?: string;
  adminOnly?: boolean;
  children?: { label: string; href: string; adminOnly?: boolean }[];
}

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/customer/b2b/dashboard' },
  {
    icon: ClipboardList,
    label: 'Quản lý Yêu cầu',
    children: [
      { label: 'Tất cả yêu cầu', href: '/customer/b2b/tickets', adminOnly: true },
      { label: 'Yêu cầu của tôi', href: '/customer/b2b/tickets' },
      { label: 'Tạo yêu cầu mới', href: '/customer/b2b/tickets/new' },
      { label: 'Chờ phê duyệt', href: '/customer/b2b/approvals' },
    ],
  },
  { icon: Users, label: 'Quản lý Thành viên', href: '/customer/b2b/members', adminOnly: true },
  {
    icon: Settings,
    label: 'Cài đặt Phê duyệt',
    adminOnly: true,
    children: [
      { label: 'Luồng phê duyệt', href: '/customer/b2b/settings/approval' },
      { label: 'Hạn mức ngân sách', href: '/customer/b2b/settings/cost-center' },
      { label: 'Ủy quyền', href: '/customer/b2b/settings/delegation' },
    ],
  },
  { icon: Wallet, label: 'Cost Center', href: '/customer/b2b/settings/cost-center', adminOnly: true },
  { icon: Monitor, label: 'Quản lý Tài sản', href: '/customer/b2b/assets' },
  { icon: FileText, label: 'Hợp đồng', href: '/customer/b2b/contracts', adminOnly: true },
  { icon: MessageCircle, label: 'Tin nhắn', href: '/customer/b2b/chat' },
  { icon: BarChart3, label: 'Báo cáo', href: '/customer/b2b/reports' },
  { icon: ScrollText, label: 'Nhật ký hệ thống', href: '/customer/b2b/audit-log', adminOnly: true },
  { icon: Bell, label: 'Thông báo', href: '/customer/b2b/notifications' },
  { icon: Building2, label: 'Cài đặt tổ chức', href: '/customer/b2b/settings/organization', adminOnly: true },
];

export default function B2BSidebar({ isOpen = false, onClose, isAdmin = false }: B2BSidebarProps) {
  const pathname = usePathname() ?? '';
  const { logout } = useAuth();
  const [expandedItems, setExpandedItems] = React.useState<string[]>([]);

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const filteredItems = menuItems.filter(
    (item) => !item.adminOnly || isAdmin
  );

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen w-64 bg-[#0f172a] text-white flex flex-col transition-transform duration-200',
        'lg:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-lg">
            M
          </div>
          <div>
            <h1 className="font-bold text-lg">MultiService</h1>
            <p className="text-xs text-emerald-400 font-medium">
              {isAdmin ? 'B2B ADMIN' : 'B2B PORTAL'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-1 text-gray-400 hover:text-white transition-colors"
          aria-label="Đóng menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = expandedItems.includes(item.label);
          const filteredChildren = item.children?.filter(
            (child) => !child.adminOnly || isAdmin
          );

          if (hasChildren) {
            const isChildActive = filteredChildren?.some(
              (child) => pathname === child.href || pathname.startsWith(child.href + '/')
            );

            return (
              <div key={item.label}>
                <button
                  onClick={() => toggleExpand(item.label)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                    isChildActive
                      ? 'bg-white/10 text-white'
                      : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                  )}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
                {isExpanded && (
                  <div className="ml-8 mt-1 space-y-0.5">
                    {filteredChildren?.map((child) => {
                      const isActive = pathname === child.href;
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={onClose}
                          className={cn(
                            'block px-3 py-2 rounded-lg text-sm transition-all',
                            isActive
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                          )}
                        >
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const isActive = item.href
            ? pathname === item.href || pathname.startsWith(item.href + '/')
            : false;

          return (
            <Link
              key={item.href || item.label}
              href={item.href || '#'}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
              )}
            >
              <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
              <span>{item.label}</span>
              {item.label === 'Thông báo' && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  5
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Sign Out */}
      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-white transition-all w-full"
        >
          <LogOut className="w-5 h-5" aria-hidden="true" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}
