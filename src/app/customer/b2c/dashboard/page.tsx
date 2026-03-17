'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Monitor,
  Printer,
  Globe,
  Smartphone,
  Cloud,
  Shield,
  Plus,
  ArrowRight,
} from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/Skeleton';

const serviceCategories = [
  { icon: Monitor, label: 'Máy tính', color: 'bg-blue-50 text-blue-600', href: '/customer/b2c/tickets/new?cat=computer' },
  { icon: Printer, label: 'Máy in', color: 'bg-purple-50 text-purple-600', href: '/customer/b2c/tickets/new?cat=printer' },
  { icon: Globe, label: 'Mạng', color: 'bg-green-50 text-green-600', href: '/customer/b2c/tickets/new?cat=network' },
  { icon: Smartphone, label: 'Mobile', color: 'bg-orange-50 text-orange-600', href: '/customer/b2c/tickets/new?cat=mobile' },
  { icon: Cloud, label: 'Cloud', color: 'bg-cyan-50 text-cyan-600', href: '/customer/b2c/tickets/new?cat=cloud' },
  { icon: Shield, label: 'Bảo mật', color: 'bg-red-50 text-red-600', href: '/customer/b2c/tickets/new?cat=security' },
];

const STATUS_MAP: Record<number, { label: string; color: string }> = {
  1: { label: 'Nháp', color: 'bg-gray-100 text-gray-600' },
  3: { label: 'Mở', color: 'bg-blue-100 text-blue-700' },
  5: { label: 'Đã duyệt giá', color: 'bg-green-100 text-green-700' },
  7: { label: 'Đang xử lý', color: 'bg-yellow-100 text-yellow-700' },
  9: { label: 'Đã giải quyết', color: 'bg-emerald-100 text-emerald-700' },
  10: { label: 'Đã đóng', color: 'bg-gray-200 text-gray-500' },
};

type Ticket = {
  id: string;
  title: string;
  status: number;
  assignedTechId?: string;
  createdAt?: string;
};

function fmtDate(iso?: string) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('vi-VN'); } catch { return iso; }
}

export default function B2CDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchTickets = async () => {
      try {
        const r = await fetch('/api/sale/tickets?page_size=5');
        const data = await r.json();
        if (!cancelled && data.tickets) setTickets(data.tickets);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchTickets();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 lg:p-8 text-white">
        <h1 className="text-2xl lg:text-3xl font-bold mb-2">
          Bạn cần hỗ trợ gì hôm nay? 👋
        </h1>
        <p className="text-blue-100 mb-4">
          Chọn dịch vụ bên dưới hoặc tạo yêu cầu mới để được hỗ trợ nhanh chóng.
        </p>
        <Link
          href="/customer/b2c/tickets/new"
          className="inline-flex items-center gap-2 bg-white text-blue-600 font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-50 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Tạo yêu cầu mới
        </Link>
      </div>

      {/* Service Categories */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Danh mục dịch vụ</h2>
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
          {serviceCategories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.label}
                href={cat.href}
                className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all group"
              >
                <div className={`w-12 h-12 rounded-xl ${cat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-sm font-medium text-gray-700">{cat.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Active Tickets */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Yêu cầu đang xử lý</h2>
          <Link href="/customer/b2c/tickets" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
            Xem tất cả <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            <CardSkeleton lines={2} />
            <CardSkeleton lines={2} />
          </div>
        ) : tickets.length === 0 ? (
          <EmptyState
            icon="list"
            title="Chưa có yêu cầu nào"
            description="Bạn chưa có yêu cầu nào đang xử lý."
          />
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => {
              const info = STATUS_MAP[ticket.status] ?? { label: `#${ticket.status}`, color: 'bg-gray-100 text-gray-600' };
              return (
                <Link
                  key={ticket.id}
                  href={`/customer/b2c/tickets/${ticket.id}`}
                  className="block bg-white rounded-xl border border-gray-100 p-4 hover:border-blue-200 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-mono text-gray-500">#{ticket.id}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${info.color}`}>
                          {info.label}
                        </span>
                      </div>
                      <h3 className="font-medium text-gray-900">{ticket.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {fmtDate(ticket.createdAt)}
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-300 mt-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating CTA - Mobile only */}
      <div className="lg:hidden fixed bottom-6 right-6 z-10">
        <Link
          href="/customer/b2c/tickets/new"
          className="w-14 h-14 bg-blue-500 rounded-full shadow-lg flex items-center justify-center text-white hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-7 h-7" />
        </Link>
      </div>
    </div>
  );
}
