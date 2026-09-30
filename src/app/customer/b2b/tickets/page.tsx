'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Search, Plus, Filter, ArrowRight, Download, Loader2 } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';

type Tab = 'all' | 'pending_approval' | 'in_progress' | 'completed';

const tabs: { key: Tab; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'pending_approval', label: 'Chờ duyệt' },
  { key: 'in_progress', label: 'Đang xử lý' },
  { key: 'completed', label: 'Hoàn thành' },
];

interface RawTicket {
  id: string;
  title: string;
  status: number;
  priority?: string;
  attributes?: string;
  createdAt?: string;
  creatorId?: string;
  orgId?: string;
  assignedTechId?: string;
  slaHours?: number;
}

interface ParsedTicket {
  id: string;
  title: string;
  dept: string;
  creator: string;
  costCenter: string;
  amount: string;
  status: string;
  statusColor: string;
  tabGroup: Tab;
  rawStatus: number;
  sla: string;
  approvalFlow: string;
  date: string;
}

function parseTicket(raw: RawTicket): ParsedTicket {
  let dept = 'IT Dept';
  let creator = raw.creatorId || 'Nhân viên';
  let costCenter = 'Phòng ban';
  let amount = '—';
  let approvalFlow = 'Tự động';

  if (raw.attributes) {
    try {
      const parsed = JSON.parse(raw.attributes);
      if (parsed.dept) dept = parsed.dept;
      if (parsed.creator) creator = parsed.creator;
      if (parsed.creatorName) creator = parsed.creatorName;
      if (parsed.costCenter) costCenter = parsed.costCenter;
      if (parsed.amount) {
        amount = typeof parsed.amount === 'number' ? parsed.amount.toLocaleString('vi-VN') + ' đ' : String(parsed.amount);
      }
      if (parsed.approvalFlow) approvalFlow = parsed.approvalFlow;
    } catch {}
  }

  let statusText = 'Mở';
  let statusColor = 'bg-blue-100 text-blue-700';
  let tabGroup: Tab = 'pending_approval';

  if (raw.status === 1) {
    statusText = 'Chờ duyệt';
    statusColor = 'bg-amber-100 text-amber-700';
    tabGroup = 'pending_approval';
    if (approvalFlow === 'Tự động') approvalFlow = '⏳ Chờ phê duyệt';
  } else if (raw.status === 3) {
    statusText = 'Chờ tiếp nhận';
    statusColor = 'bg-yellow-100 text-yellow-700';
    tabGroup = 'pending_approval';
    if (approvalFlow === 'Tự động') approvalFlow = '✅ Đã duyệt';
  } else if (raw.status === 5) {
    statusText = 'Đã duyệt giá';
    statusColor = 'bg-indigo-100 text-indigo-700';
    tabGroup = 'in_progress';
    if (approvalFlow === 'Tự động') approvalFlow = '✅ Báo giá hoàn tất';
  } else if (raw.status === 7) {
    statusText = 'Đang xử lý';
    statusColor = 'bg-blue-100 text-blue-700';
    tabGroup = 'in_progress';
    if (approvalFlow === 'Tự động') approvalFlow = '🛠 KTV xử lý';
  } else if (raw.status === 9 || raw.status === 10) {
    statusText = raw.status === 9 ? 'Hoàn thành' : 'Đã đóng';
    statusColor = 'bg-emerald-100 text-emerald-700';
    tabGroup = 'completed';
    if (approvalFlow === 'Tự động') approvalFlow = '✅ Hoàn tất';
  }

  const date = raw.createdAt
    ? new Date(raw.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
    : '—';

  return {
    id: raw.id,
    title: raw.title,
    dept,
    creator,
    costCenter,
    amount,
    status: statusText,
    statusColor,
    tabGroup,
    rawStatus: raw.status,
    sla: raw.priority || 'Normal',
    approvalFlow,
    date,
  };
}

export default function TicketsB2B() {
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');
  const [tickets, setTickets] = useState<ParsedTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/sale/tickets?page_size=100')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data.tickets)) {
          setTickets(data.tickets.map((t: RawTicket) => parseTicket(t)));
        }
      })
      .catch((err) => {
        console.error('Failed to load tickets', err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredTickets = useMemo(() => {
    let result = tickets;
    if (activeTab !== 'all') {
      result = result.filter((t) => t.tabGroup === activeTab);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.id.toLowerCase().includes(q) ||
          t.title.toLowerCase().includes(q) ||
          t.creator.toLowerCase().includes(q) ||
          t.dept.toLowerCase().includes(q)
      );
    }
    return result;
  }, [tickets, activeTab, search]);

  const tabCounts = useMemo(
    () => ({
      pending_approval: tickets.filter((t) => t.tabGroup === 'pending_approval').length,
      in_progress: tickets.filter((t) => t.tabGroup === 'in_progress').length,
      completed: tickets.filter((t) => t.tabGroup === 'completed').length,
    }),
    [tickets]
  );

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-gray-900">Quản lý Yêu cầu</h1>
        <div className="flex gap-2">
          <Link
            href="/customer/b2b/tickets/new"
            className="inline-flex items-center gap-1.5 bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors"
          >
            <Plus className="w-4 h-4" /> Tạo mới
          </Link>
          <button
            onClick={() => {
              if (tickets.length === 0) return;
              const csv = [
                ['Mã', 'Tiêu đề', 'Phòng', 'Người tạo', 'Giá trị', 'Trạng thái', 'Ngày'],
                ...tickets.map((t) => [t.id, `"${t.title.replace(/"/g, '""')}"`, t.dept, t.creator, t.amount, t.status, t.date]),
              ]
                .map((row) => row.join(','))
                .join('\n');
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `b2b_tickets_${new Date().toISOString().slice(0, 10)}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="inline-flex items-center gap-1.5 border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo mã ticket, tiêu đề, nhân viên..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <button className="inline-flex items-center gap-1.5 border border-gray-200 px-4 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
          <Filter className="w-4 h-4" /> Bộ lọc
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto">
        {tabs.map((tab) => {
          const count = tab.key === 'all' ? undefined : tabCounts[tab.key];
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.key ? 'bg-white text-[#0f172a] shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {count != null && count > 0 && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.key ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Mã</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Tiêu đề</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Phòng</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Người tạo</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Giá trị</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Trạng thái</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Luồng duyệt</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                    Đang tải danh sách yêu cầu...
                  </td>
                </tr>
              ) : filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <EmptyState
                      icon="list"
                      title="Không tìm thấy yêu cầu"
                      description={search ? 'Thử thay đổi từ khóa tìm kiếm.' : 'Chưa có yêu cầu nào trong mục này.'}
                      actionLabel={activeTab !== 'all' ? 'Xem tất cả' : 'Tạo yêu cầu mới'}
                      onAction={() => {
                        if (activeTab !== 'all') setActiveTab('all');
                      }}
                    />
                  </td>
                </tr>
              ) : (
                filteredTickets.map((t) => (
                  <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-gray-500 text-xs font-semibold">#{t.id.slice(-6)}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">{t.title}</td>
                    <td className="px-4 py-3 text-gray-600">{t.dept}</td>
                    <td className="px-4 py-3 text-gray-600">{t.creator}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{t.amount}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${t.statusColor}`}>{t.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{t.approvalFlow}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/customer/b2b/tickets/${t.id}`} className="text-emerald-600 hover:text-emerald-700 inline-block p-1">
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
