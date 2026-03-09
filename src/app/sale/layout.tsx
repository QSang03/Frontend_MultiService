'use client';

import SaleSidebar from '@/components/layout/SaleSidebar';
import SaleHeader from '@/components/layout/SaleHeader';
import { ToastProvider } from '@/components/ui';

export default function SaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#f8f9fc]">
        <SaleSidebar />
        <div className="ml-64" style={{ minHeight: '100vh' }}>
          <SaleHeader />
          <main className="p-0">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
