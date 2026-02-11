'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Ticket,
  Users,
  Settings,
  DollarSign,
  Package,
  Building2,
  Wrench,
  LogOut,
  Shield,
  FileText,
} from 'lucide-react';
import { cn } from '@/utils';
import { useAuth } from '@/hooks/useAuth';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard' },
  { icon: Ticket, label: 'Ticket Monitor', href: '/admin/tickets' },
  { icon: FileText, label: 'Contract & E-Sign', href: '/admin/contract-esign' },
  { icon: Users, label: 'User & RBAC', href: '/admin/users' },
  { icon: Wrench, label: 'Service Config', href: '/admin/service-config' },
  { icon: DollarSign, label: 'Finance & Profit', href: '/admin/finance' },
  { icon: Package, label: 'Inventory & RMA', href: '/admin/inventory' },
  { icon: Building2, label: 'Tenant B2B', href: '/admin/tenant-b2b' },
  { icon: Shield, label: 'Active Sessions', href: '/admin/sessions' },
  { icon: Settings, label: 'System Settings', href: '/admin/system-settings' },
];

export default function AdminSidebar() {
  const pathname = usePathname() ?? '';
  const { logout } = useAuth();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-[#1e2a4a] text-white flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-lg">
          M
        </div>
        <div>
          <h1 className="font-bold text-lg">MultiService</h1>
          <p className="text-xs text-gray-400">ADMIN PORTAL</p>
        </div>
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
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-white/10 hover:text-white'
              )}
            >
              <Icon className="w-5 h-5" />
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
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
