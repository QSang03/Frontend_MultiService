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
  UserCircle,
} from 'lucide-react';
import { cn } from '@/utils';
import { useAuth } from '@/hooks/useAuth';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/sale/dashboard' },
  { icon: Users, label: 'CRM & Leads', href: '/sale/customers' },
  { icon: FileText, label: 'Quotes & Contracts', href: '/sale/quotations' },
  { icon: Headphones, label: 'Support & Tracking', href: '/sale/support' },
  { icon: CreditCard, label: 'Payments & Invoices', href: '/sale/revenue' },
  { icon: DollarSign, label: 'Commissions & Finance', href: '/sale/contracts' },
];

export default function SaleSidebar() {
  const pathname = usePathname() ?? '';
  const { logout, user } = useAuth();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-[#1e1f30] text-white flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-lg">
          M
        </div>
        <div>
          <h1 className="font-bold text-lg">MultiService</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
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

      {/* User Profile */}
      <div className="px-4 py-4 border-t border-white/10">
        <Link 
          href="/sale/profile"
          className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-white/10 transition-all"
        >
          <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center shrink-0">
            <UserCircle className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.name || 'Alex Sale Rep'}
            </p>
            <p className="text-xs text-gray-400 truncate">System Sale</p>
          </div>
          <LogOut 
            onClick={(e) => {
              e.preventDefault();
              logout();
            }}
            className="w-4 h-4 text-gray-400 hover:text-white cursor-pointer shrink-0" 
          />
        </Link>
      </div>
    </aside>
  );
}
