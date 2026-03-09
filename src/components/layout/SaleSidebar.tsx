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
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/utils';
import { useAuth } from '@/hooks/useAuth';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/sale/dashboard', color: 'from-blue-500 to-indigo-500' },
  { icon: Users, label: 'CRM & Leads', href: '/sale/customers', color: 'from-violet-500 to-purple-500' },
  { icon: FileText, label: 'Quotes & Contracts', href: '/sale/quotations', color: 'from-cyan-500 to-blue-500' },
  { icon: Headphones, label: 'Support & Tracking', href: '/sale/support', color: 'from-amber-500 to-orange-500' },
  { icon: CreditCard, label: 'Payments & Invoices', href: '/sale/revenue', color: 'from-teal-500 to-emerald-500' },
  { icon: DollarSign, label: 'Commissions', href: '/sale/contracts', color: 'from-rose-500 to-pink-500' },
];

export default function SaleSidebar() {
  const pathname = usePathname() ?? '';
  const { logout, user } = useAuth();

  const initials = (user?.name || 'AS').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-[#0f1117] text-white flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5">
        <div className="w-9 h-9 bg-gradient-to-br from-violet-600 to-blue-600 rounded-xl flex items-center justify-center font-black text-base shadow-lg shadow-violet-900/40">
          M
        </div>
        <div>
          <h1 className="font-extrabold text-sm tracking-tight">MultiService</h1>
          <p className="text-[10px] text-gray-500 mt-0.5">Sales Portal</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative',
                isActive
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              )}
            >
              {isActive && (
                <span className={`absolute inset-0 rounded-xl bg-gradient-to-r ${item.color} opacity-20`} />
              )}
              <div className={cn(
                'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all',
                isActive
                  ? `bg-gradient-to-br ${item.color} shadow-md`
                  : 'bg-white/5 group-hover:bg-white/10'
              )}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/50" />}
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="px-3 py-3 border-t border-white/5">
        <Link 
          href="/sale/profile"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all group"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-rose-500 rounded-full flex items-center justify-center shrink-0 text-xs font-bold shadow">
            {user ? initials : <UserCircle className="w-4 h-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">
              {user?.name || 'Alex Sale Rep'}
            </p>
            <p className="text-[10px] text-emerald-400 font-medium">● Online</p>
          </div>
          <LogOut 
            onClick={(e) => {
              e.preventDefault();
              logout();
            }}
            className="w-3.5 h-3.5 text-gray-500 hover:text-white cursor-pointer shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" 
          />
        </Link>
      </div>
    </aside>
  );
}
