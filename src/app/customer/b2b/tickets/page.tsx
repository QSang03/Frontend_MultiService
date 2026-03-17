'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Plus, Filter, ArrowRight, Download } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';

type Tab = 'all' | 'pending_approval' | 'in_progress' | 'completed';

const tabs: { key: Tab; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'pending_approval', label: 'Chờ duyệt' },
  { key: 'in_progress', label: 'Đang xử lý' },
  { key: 'completed', label: 'Hoàn thành' },
];

interface Ticket {
  id: string;
  title: string;
  dept: string;
  creator: string;
  costCenter: string;
  amount: string;
  status: string;
  statusColor: string;
  sla: string;
  approvalFlow: string;
  date: string;
}

const tickets: Ticket[] = [
  { id: 'T-0055', title: 'Nâng cấp RAM 5 máy tính', dept: 'IT', creator: 'Nguyễn Văn B', costCenter: 'IT Department', amount: '5,000,000', status: 'Chờ Admin duyệt', statusColor: 'bg-yellow-100 text-yellow-700', sla: 'Medium', approvalFlow: '✅ Manager → ⏳ Admin', date: '14/03' },
  { id: 'T-0054', title: 'Mua license Microsoft 365', dept: 'HR', creator: 'Lê Thị D', costCenter: 'HR', amount: '3,200,000', status: 'Chờ Manager duyệt', statusColor: 'bg-yellow-100 text-yellow-700', sla: 'Low', approvalFlow: '⏳ Manager', date: '14/03' },
  { id: 'T-0053', title: 'Sửa mạng WiFi tầng 5', dept: 'IT', creator: 'Trần Văn C', costCenter: 'IT Department', amount: '1,500,000', status: 'Đang xử lý', statusColor: 'bg-blue-100 text-blue-700', sla: 'High', approvalFlow: '✅ Duyệt xong', date: '13/03' },
  { id: 'T-0052', title: 'Bảo trì máy in Phòng IT', dept: 'IT', creator: 'Nguyễn Văn B', costCenter: 'IT Department', amount: '800,000', status: 'Hoàn thành', statusColor: 'bg-green-100 text-green-700', sla: 'Medium', approvalFlow: '✅ Duyệt xong', date: '12/03' },
  { id: 'T-0050', title: 'Cài đặt ERP kế toán', dept: 'Sales', creator: 'Phạm Hải', costCenter: 'Sales', amount: '8,000,000', status: 'Đang xử lý', statusColor: 'bg-blue-100 text-blue-700', sla: 'Medium', approvalFlow: '✅ Duyệt xong', date: '11/03' },
  { id: 'T-0048', title: 'Sửa server NAS', dept: 'IT', creator: 'Trần Văn C', costCenter: 'IT Department', amount: '12,000,000', status: 'Đang xử lý', statusColor: 'bg-blue-100 text-blue-700', sla: 'High', approvalFlow: '✅ Duyệt xong', date: '10/03' },
];

export default function TicketsB2B() {
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');

  const filteredTickets = useMemo(() => {
    let result = tickets;
    if (activeTab === 'pending_approval') result = result.filter((t) => t.status.includes('Chờ'));
    else if (activeTab === 'in_progress') result = result.filter((t) => t.status.includes('Đang'));
    else if (activeTab === 'completed') result = result.filter((t) => t.status.includes('Hoàn thành'));

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
  }, [activeTab, search]);

  const tabCounts = useMemo(() => ({
    pending_approval: tickets.filter((t) => t.status.includes('Chờ')).length,
    in_progress: tickets.filter((t) => t.status.includes('Đang')).length,
    completed: tickets.filter((t) => t.status.includes('Hoàn thành')).length,
  }), []);

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-gray-900">Quản lý Yêu cầu</h1>
        <div className="flex gap-2">
          <Link href="/customer/b2b/tickets/new" className="inline-flex items-center gap-1.5 bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors">
            <Plus className="w-4 h-4" /> Tạo mới
          </Link>
          <button className="inline-flex items-center gap-1.5 border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo mã ticket, tiêu đề, nhân viên..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
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
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.key ? 'bg-white text-[#0f172a] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {tab.label}
            {count != null && count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'}`}>
                {count}
              </span>
            )}
          </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
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
              {filteredTickets.length === 0 ? (
                <tr><td colSpan={8}><EmptyState icon="list" title="Không tìm thấy yêu cầu" description="Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm." /></td></tr>
              ) : filteredTickets.map((t) => (
                <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-gray-500">#{t.id}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{t.title}</td>
                  <td className="px-4 py-3 text-gray-600">{t.dept}</td>
                  <td className="px-4 py-3 text-gray-600">{t.creator}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{t.amount}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${t.statusColor}`}>{t.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{t.approvalFlow}</td>
                  <td className="px-4 py-3">
                    <Link href={`/customer/b2b/tickets/${t.id}`} className="text-emerald-600 hover:text-emerald-700">
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
