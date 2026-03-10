'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { decodeRole } from '@/utils';

const pageTitleMap: Record<string, string> = {
  dashboard: 'Dashboard',
  customers: 'CRM & Leads',
  quotations: 'Quotes & Contracts',
  support: 'Support & Tracking',
  revenue: 'Payments & Invoices',
  contracts: 'Commissions',
  profile: 'Profile',
  orders: 'Orders',
};

export default function SaleHeader() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname() ?? '';

  const segments = pathname.split('/').filter(Boolean);
  const currentSegment = segments[segments.length - 1] ?? '';
  const pageTitle = pageTitleMap[currentSegment] ?? currentSegment;

  const initials = useMemo(() => {
    return (user?.name || 'AS').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
  }, [user?.name]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header translate="no" className="notranslate h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <h1 className="text-xl font-semibold text-gray-900">{pageTitle}</h1>

      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* User Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setOpen((s) => !s)}
            className="flex items-center gap-3 px-3 py-1 rounded-md hover:bg-gray-50 focus:outline-none"
            aria-haspopup="true"
            aria-expanded={open}
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">
                {user?.name || 'Sale Staff'}
              </p>
              <p className="text-xs text-gray-500">
                {decodeRole(user?.role)}
              </p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {initials}
            </div>
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-100 rounded-lg shadow-lg z-50">
              <div className="p-4">
                <div className="mb-3">
                  <p className="text-sm font-semibold text-gray-900">{user?.name || 'Sale Staff'}</p>
                  <p className="text-xs text-gray-500">{user?.email || ''}</p>
                </div>
                <nav className="flex flex-col divide-y divide-gray-100">
                  <Link href="/sale/profile" className="py-2 text-sm text-gray-700 hover:text-blue-600">
                    My Profile
                  </Link>
                  <button onClick={() => { setOpen(false); logout(); }} className="py-2 text-sm text-red-600 text-left">
                    Sign Out
                  </button>
                </nav>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
