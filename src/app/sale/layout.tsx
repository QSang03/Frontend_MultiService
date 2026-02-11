'use client';

import SaleSidebar from '@/components/layout/SaleSidebar';
import SaleHeader from '@/components/layout/SaleHeader';

export default function SaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <SaleSidebar />
      <div className="ml-64">
        <SaleHeader />
        <main>{children}</main>
      </div>
    </div>
  );
}
