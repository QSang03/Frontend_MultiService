'use client';

import TechSidebar from '@/components/layout/TechSidebar';

export default function TechLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <TechSidebar />
      <main className="flex-1 ml-64 h-full relative overflow-hidden">
        {children}
      </main>
    </div>
  );
}
