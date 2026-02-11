'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ClipboardList,
  Package,
  BookOpen,
  BarChart2,
  User,
  Wrench,
  LogOut,
  Settings,
  ChevronUp
} from 'lucide-react';
import { cn } from '@/utils';
import { useAuth } from '@/hooks/useAuth';

const menuItems = [
  { icon: ClipboardList, label: 'My Jobs', href: '/tech/tasks' },
  { icon: Package, label: 'My Inventory', href: '/tech/inventory' },
  { icon: BookOpen, label: 'Knowledge Base', href: '/tech/knowledge-base' },
  { icon: BarChart2, label: 'Performance', href: '/tech/dashboard' },
];

export default function TechSidebar() {
  const pathname = usePathname() ?? '';
  const { logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-[#0f172a] text-white flex flex-col border-r border-gray-800">
      {/* Header / Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-gray-800/50">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/50 shrink-0">
          <Wrench className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight">TechPortal</h1>
          <p className="text-xs text-gray-400">Field Service App</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          // Check active state
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group',
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                  : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
              )}
            >
              <Icon className={cn("w-5 h-5", isActive ? "text-white" : "text-gray-400 group-hover:text-gray-200")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User / Footer */}
      <div className="px-4 py-6 border-t border-gray-800 relative">
        {/* Menu Popover - Opens upwards */}
        {isUserMenuOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsUserMenuOpen(false)} 
            />
            <div className="absolute bottom-[calc(100%+10px)] left-4 right-4 bg-[#1e293b] border border-gray-700 rounded-xl shadow-xl shadow-black/50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200 z-50 transform origin-bottom">
              <Link 
                href="/tech/profile" 
                onClick={() => setIsUserMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors border-b border-gray-700/50"
              >
                <User className="w-4 h-4" />
                View Profile
              </Link>
              <button className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors w-full text-left border-b border-gray-700/50">
                <Settings className="w-4 h-4" />
                Settings
              </button>
              <button 
                onClick={() => {
                  logout();
                  setIsUserMenuOpen(false);
                }}
                className="flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors w-full text-left"
              >
                <LogOut className="w-4 h-4" />
                Log Out
              </button>
            </div>
          </>
        )}

        <button 
          onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-2xl w-full transition-all duration-200 group relative overflow-hidden",
            isUserMenuOpen ? "bg-white/10 ring-1 ring-white/20" : "hover:bg-white/5"
          )}
        >
          <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-300 relative shrink-0 ring-2 ring-[#0f172a]">
             <User className="w-5 h-5" />
             <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0f172a]"></div>
          </div>
          
          <div className="flex-1 min-w-0 text-left">
            <h4 className="text-sm font-semibold truncate text-gray-200 group-hover:text-white transition-colors">Alex Tech</h4>
             <div className="flex items-center gap-1.5 align-middle">
               <span className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
                <span className="text-xs text-gray-400 flex items-center gap-1 group-hover:text-gray-300">Online</span>
             </div>
          </div>

          <div className={cn(
            "text-gray-500 transition-transform duration-300", 
            isUserMenuOpen ? "rotate-180 text-gray-300" : "group-hover:text-gray-300"
          )}>
            <ChevronUp className="w-4 h-4" />
          </div>
        </button>
      </div>
    </aside>
  );
}
