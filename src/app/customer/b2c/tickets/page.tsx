'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Plus, ArrowRight, Circle, Loader2 } from 'lucide-react';

type StatusFilter = 'all' | 'open' | 'in_progress' | 'resolved' | 'closed';

type Ticket = {
  id: string;
  title: string;
  status: number;
  priority?: string;
  categoryId?: string;
  assignedTechId?: string;
  createdAt?: string;
};

const STATUS_MAP: Record<number, { label: string; color: string; filter: StatusFilter }> = {
  1: { label: 'Nháp', color: 'bg-gray-100 text-gray-600', filter: 'open' },
  3: { label: 'Mở', color: 'bg-blue-100 text-blue-700', filter: 'open' },
  5: { label: 'Đã duyệt giá', color: 'bg-green-100 text-green-700', filter: 'open' },
  7: { label: 'Đang xử lý', color: 'bg-yellow-100 text-yellow-700', filter: 'in_progress' },
  9: { label: 'Đã giải quyết', color: 'bg-emerald-100 text-emerald-700', filter: 'resolved' },
  10: { label: 'Đã đóng', color: 'bg-gray-200 text-gray-500', filter: 'closed' },
};

function getStatusInfo(status: number) {
  return STATUS_MAP[status] ?? { label: `#${status}`, color: 'bg-gray-100 text-gray-600', filter: 'open' as StatusFilter };
}

function fmtDate(iso?: string) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('vi-VN'); } catch { return iso; }
}

const tabs: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'in_progress', label: 'Đang xử lý' },
  { key: 'open', label: 'Chờ xác nhận' },
  { key: 'resolved', label: 'Đã hoàn thành' },
];

export default function MyTicketsB2C() {
  const [activeTab, setActiveTab] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/sale/tickets?page_size=100')
      .then((r) => r.json())
      .then((data) => { if (!cancelled && data.tickets) setTickets(data.tickets); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const filteredTickets = tickets.filter((t) => {
    const info = getStatusInfo(t.status);
    const matchTab = activeTab === 'all' || info.filter === activeTab;
    const matchSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchTab && matchSearch;
  });

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-gray-900">Yêu cầu của tôi</h1>
        <Link
          href="/customer/b2c/tickets/new"
          className="inline-flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Tạo yêu cầu mới
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm theo mã ticket hoặc tiêu đề..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.key ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
            <Circle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Không có yêu cầu nào phù hợp.</p>
          </div>
        ) : (
          filteredTickets.map((ticket) => {
            const info = getStatusInfo(ticket.status);
            return (
              <Link
                key={ticket.id}
                href={`/customer/b2c/tickets/${ticket.id}`}
                className="block bg-white rounded-xl border border-gray-100 p-4 hover:border-blue-200 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-mono text-gray-500">#{ticket.id.slice(0, 8)}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${info.color}`}>{info.label}</span>
                    </div>
                    <h3 className="font-medium text-gray-900">{ticket.title}</h3>
                    <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                      {ticket.categoryId && <span>{ticket.categoryId}</span>}
                      {ticket.assignedTechId && <><span>·</span><span>Tech: {ticket.assignedTechId}</span></>}
                      <span>·</span>
                      <span>{fmtDate(ticket.createdAt)}</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 mt-2 ml-4" />
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
