'use client';

import React, { useState } from 'react';
import { Plus, Search, AlertCircle, CheckCircle2, Clock, DollarSign, TrendingUp, FileText } from 'lucide-react';
import CreateInvoiceModal from './CreateInvoiceModal';
import { useToast } from '@/components/ui';

interface Invoice {
  id: string;
  client: string;
  amount: number;
  dueDate: string;
  status: string;
}

const INITIAL_INVOICES: Invoice[] = [
  { id: 'INV-2024-001', client: 'TechSolutions Ltd', amount: 50000000, dueDate: '2024-02-15', status: 'pending_verification' },
  { id: 'INV-2024-002', client: 'Nguyen Van A',      amount: 1500000,  dueDate: '2024-01-25', status: 'paid' },
  { id: 'INV-2024-003', client: 'StartUp Alpha',     amount: 12000000, dueDate: '2024-02-01', status: 'overdue' },
];

const statusConfig: Record<string, { label: string; color: string; dot: string; icon: React.ReactNode }> = {
  paid:                 { label: 'Đã thanh toán',    color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-400', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  pending_verification: { label: 'Chờ xác nhận',     color: 'bg-amber-100 text-amber-700',    dot: 'bg-amber-400',   icon: <Clock        className="w-3.5 h-3.5" /> },
  overdue:              { label: 'Quá hạn',           color: 'bg-red-100 text-red-700',        dot: 'bg-red-400',     icon: <AlertCircle  className="w-3.5 h-3.5" /> },
};

const filterTabs = [
  { key: 'all',                 label: 'Tất cả' },
  { key: 'pending_verification',label: 'Chờ xác nhận' },
  { key: 'paid',                label: 'Đã thanh toán' },
  { key: 'overdue',             label: 'Quá hạn' },
];

export default function RevenuePage() {
  const [invoices, setInvoices] = useState(INITIAL_INVOICES);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { addToast } = useToast();

  const fmt = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  const handleCreateSuccess = (newInvoice: Invoice) => {
    setInvoices([newInvoice, ...invoices]);
  };

  const filtered = invoices.filter(inv => {
    if (statusFilter !== 'all' && inv.status !== statusFilter) return false;
    if (searchQuery && !inv.id.toLowerCase().includes(searchQuery.toLowerCase()) && !inv.client.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const pendingAmt  = invoices.filter(i => i.status === 'pending_verification').reduce((s, i) => s + i.amount, 0);
  const overdueAmt  = invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + i.amount, 0);
  const collectedAmt = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0);

  const kpis = [
    { label: 'Chờ xác nhận',      value: fmt(pendingAmt),  sub: `${invoices.filter(i => i.status === 'pending_verification').length} hóa đơn`, gradient: 'from-amber-500 to-orange-500', icon: Clock },
    { label: 'Nợ quá hạn',        value: fmt(overdueAmt),  sub: 'Cần xử lý ngay',   gradient: 'from-rose-500 to-red-600',      icon: AlertCircle },
    { label: 'Đã thu tháng này',   value: fmt(collectedAmt),sub: 'Tiếp tục phát huy!', gradient: 'from-emerald-500 to-teal-600', icon: TrendingUp },
    { label: 'Tổng hóa đơn',      value: String(invoices.length), sub: 'trong hệ thống', gradient: 'from-blue-500 to-indigo-600', icon: FileText },
  ];

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Thanh toán & Hóa đơn
          </h1>
          <p className="text-gray-500 text-sm mt-1">Theo dõi thu tiền, xác nhận chuyển khoản và quản lý hóa đơn</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2.5 rounded-xl font-medium text-sm shadow-sm hover:shadow-md hover:from-blue-600 hover:to-indigo-700 transition-all"
        >
          <Plus className="w-4 h-4" />
          Tạo hóa đơn
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-4">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${k.gradient} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold text-gray-800 truncate">{k.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{k.label}</p>
                <p className="text-xs text-gray-400">{k.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter tabs + search */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {filterTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === tab.key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm mã hóa đơn, khách hàng..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/80 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3.5 font-medium text-gray-500 text-xs uppercase tracking-wide">Mã hóa đơn</th>
                <th className="px-6 py-3.5 font-medium text-gray-500 text-xs uppercase tracking-wide">Khách hàng</th>
                <th className="px-6 py-3.5 font-medium text-gray-500 text-xs uppercase tracking-wide text-right">Số tiền</th>
                <th className="px-6 py-3.5 font-medium text-gray-500 text-xs uppercase tracking-wide">Hạn thanh toán</th>
                <th className="px-6 py-3.5 font-medium text-gray-500 text-xs uppercase tracking-wide text-center">Trạng thái</th>
                <th className="px-6 py-3.5 font-medium text-gray-500 text-xs uppercase tracking-wide text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length > 0 ? (
                filtered.map((inv) => {
                  const cfg = statusConfig[inv.status] ?? { label: inv.status, color: 'bg-gray-100 text-gray-700', dot: 'bg-gray-400', icon: <DollarSign className="w-3.5 h-3.5" /> };
                  return (
                    <tr key={inv.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs font-medium text-gray-800">{inv.id}</td>
                      <td className="px-6 py-4 text-gray-700">{inv.client}</td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-800">{fmt(inv.amount)}</td>
                      <td className="px-6 py-4 text-gray-500 text-xs">{inv.dueDate}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${cfg.color}`}>
                          {cfg.icon}
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {inv.status === 'pending_verification' && (
                          <button
                            onClick={() => addToast(`Đã gửi xác nhận slip cho ${inv.client}`, { type: 'info' })}
                            className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            Xác nhận slip
                          </button>
                        )}
                        {inv.status === 'overdue' && (
                          <button
                            onClick={() => addToast(`Đã gửi nhắc nhở thanh toán cho ${inv.client}`, { type: 'success' })}
                            className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            Gửi nhắc nhở
                          </button>
                        )}
                        {inv.status === 'paid' && (
                          <button
                            onClick={() => addToast(`Chi tiết hóa đơn ${inv.id}`, { type: 'info' })}
                            className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                          >
                            Xem chi tiết
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                        <FileText className="w-7 h-7 text-gray-300" />
                      </div>
                      <p className="text-gray-500 font-medium">Không tìm thấy hóa đơn</p>
                      <p className="text-gray-400 text-xs">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CreateInvoiceModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
