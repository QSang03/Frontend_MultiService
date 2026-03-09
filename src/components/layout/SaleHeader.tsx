'use client';

import { Search, Bell, ChevronRight, LayoutDashboard } from 'lucide-react';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const breadcrumbMap: Record<string, string> = {
  dashboard: 'Dashboard',
  customers: 'CRM & Leads',
  quotations: 'Quotes & Contracts',
  support: 'Support & Tracking',
  revenue: 'Payments & Invoices',
  contracts: 'Commissions',
  profile: 'Profile',
};

export default function SaleHeader() {
  const [searchQuery, setSearchQuery] = useState('');
  const pathname = usePathname() ?? '';
  const segments = pathname.split('/').filter(Boolean);
  const currentSegment = segments[segments.length - 1] ?? '';
  const pageLabel = breadcrumbMap[currentSegment] ?? currentSegment;

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100 px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-sm">
          <Link href="/sale/dashboard" className="text-gray-400 hover:text-gray-600 transition-colors">
            <LayoutDashboard className="w-4 h-4" />
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
          <span className="font-semibold text-gray-800">{pageLabel}</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm w-52 focus:w-72 transition-all focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent bg-gray-50 focus:bg-white"
            />
          </div>

          {/* Notification Bell */}
          <button className="relative p-2 text-gray-400 hover:text-gray-700 transition-colors rounded-xl hover:bg-gray-100">
            <Bell className="w-4.5 h-4.5" style={{ width: '18px', height: '18px' }} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
          </button>
        </div>
      </div>
    </header>
  );
}
