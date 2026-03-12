'use client';

import { useState } from 'react';
import SaleSidebar from '@/components/layout/SaleSidebar';
import SaleHeader from '@/components/layout/SaleHeader';
import { ToastProvider } from '@/components/ui';

export default function SaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#f8f9fc]">
        <SaleSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <div className="lg:ml-64" style={{ minHeight: '100vh' }}>
          <SaleHeader onMenuToggle={() => setSidebarOpen((v) => !v)} />
          <main className="p-0">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
