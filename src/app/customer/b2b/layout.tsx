'use client';

import { useState } from 'react';
import B2BSidebar from '@/components/layout/B2BSidebar';
import B2BHeader from '@/components/layout/B2BHeader';
import { ToastProvider } from '@/components/ui';

export default function B2BLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isAdmin = true;

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#f1f5f9]">
        <B2BSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isAdmin={isAdmin} />
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <div className="lg:ml-64" style={{ minHeight: '100vh' }}>
          <B2BHeader onMenuToggle={() => setSidebarOpen((v) => !v)} isAdmin={isAdmin} />
          <main className="p-0">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
