'use client';

import { useState } from 'react';
import B2CSidebar from '@/components/layout/B2CSidebar';
import B2CHeader from '@/components/layout/B2CHeader';
import { ToastProvider } from '@/components/ui';

export default function B2CLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#f8fafc]">
        <B2CSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <div className="lg:ml-64" style={{ minHeight: '100vh' }}>
          <B2CHeader onMenuToggle={() => setSidebarOpen((v) => !v)} />
          <main className="p-0">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
