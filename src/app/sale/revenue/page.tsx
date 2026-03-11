'use client';

import React, { useState } from 'react';
import { Plus, Search, AlertCircle, CheckCircle2, Clock, DollarSign, TrendingUp, FileText, Download } from 'lucide-react';
import CreateInvoiceModal from './CreateInvoiceModal';

interface Invoice {
  id: string;
  client: string;
  amount: number;
  dueDate: string;
  status: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
}

const INITIAL_INVOICES: Invoice[] = [
  { id: 'INV-2024-001', client: 'TechSolutions Ltd', amount: 50000000, dueDate: '2024-02-15', status: 'pending_verification', createdBy: 'Nguyen Sale', updatedAt: '2024-01-20T08:30:00Z', updatedBy: 'Nguyen Sale' },
  { id: 'INV-2024-002', client: 'Nguyen Van A',      amount: 1500000,  dueDate: '2024-01-25', status: 'paid',                 createdBy: 'Tran Sale',   updatedAt: '2024-01-25T14:20:00Z', updatedBy: 'Admin' },
  { id: 'INV-2024-003', client: 'StartUp Alpha',     amount: 12000000, dueDate: '2024-02-01', status: 'overdue',              createdBy: 'Nguyen Sale', updatedAt: '2024-01-28T09:00:00Z', updatedBy: 'Nguyen Sale' },
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

  const fmt = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  const handleCreateSuccess = (newInvoice: Invoice) => {
    setInvoices([{ ...newInvoice, createdBy: 'Bạn', updatedAt: new Date().toISOString(), updatedBy: 'Bạn' }, ...invoices]);
  };

  const handleExportPDF = (inv: Invoice) => {
    const fmtAmt = fmt(inv.amount);
    const cfg = statusConfig[inv.status] ?? { label: inv.status };
    const html = `<!DOCTYPE html>
<html lang="vi"><head><meta charset="utf-8"><title>Hóa đơn ${inv.id}</title>
<style>
  body{font-family:Arial,sans-serif;max-width:700px;margin:40px auto;color:#111;font-size:14px}
  h1{font-size:22px;color:#1e40af;margin-bottom:4px}
  .sub{color:#6b7280;font-size:12px;margin-bottom:24px}
  table{width:100%;border-collapse:collapse;margin-top:16px}
  th{background:#f3f4f6;padding:8px 12px;text-align:left;font-size:12px;text-transform:uppercase;color:#6b7280}
  td{padding:10px 12px;border-bottom:1px solid #f3f4f6}
  .amount{font-weight:700;font-size:16px;color:#1e40af}
  .footer{margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af}
  @media print{body{margin:0}}
</style></head>
<body>
<h1>HÓA ĐƠN THANH TOÁN</h1>
<p class="sub">Mã hóa đơn: <strong>${inv.id}</strong></p>
<table>
  <tr><th>Thông tin</th><th>Chi tiết</th></tr>
  <tr><td>Khách hàng</td><td><strong>${inv.client}</strong></td></tr>
  <tr><td>Số tiền</td><td class="amount">${fmtAmt}</td></tr>
  <tr><td>Hạn thanh toán</td><td>${inv.dueDate}</td></tr>
  <tr><td>Trạng thái</td><td>${cfg.label}</td></tr>
  ${inv.createdBy ? `<tr><td>Tạo bởi</td><td>${inv.createdBy}</td></tr>` : ''}
  ${inv.updatedAt ? `<tr><td>Cập nhật lần cuối</td><td>${new Date(inv.updatedAt).toLocaleString('vi-VN')}${inv.updatedBy ? ' · bởi ' + inv.updatedBy : ''}</td></tr>` : ''}
</table>
<div class="footer">Xuất ngày: ${new Date().toLocaleString('vi-VN')}</div>
<script>window.onload=()=>{ window.print(); }<\/script>
</body></html>`;
    const win = window.open('', '_blank', 'width=800,height=600');
    if (win) { win.document.write(html); win.document.close(); }
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
                      <td className="px-6 py-4">
                        <span className="text-gray-700">{inv.client}</span>
                        {(inv.updatedAt || inv.createdBy) && (
                          <div className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5 flex-shrink-0" />
                            <span>
                              {inv.updatedAt
                                ? `${new Date(inv.updatedAt).toLocaleDateString('vi-VN')}${inv.updatedBy ? ' · ' + inv.updatedBy : ''}`
                                : inv.createdBy}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-800">{fmt(inv.amount)}</td>
                      <td className="px-6 py-4 text-gray-500 text-xs">{inv.dueDate}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${cfg.color}`}>
                          {cfg.icon}
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleExportPDF(inv)}
                            title="Xuất PDF hóa đơn"
                            className="text-gray-400 hover:text-blue-600 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          {inv.status === 'pending_verification' && (
                            <button className="text-blue-600 hover:text-blue-700 text-xs font-medium hover:underline">Xác nhận slip</button>
                          )}
                          {inv.status === 'overdue' && (
                            <button className="text-red-600 hover:text-red-700 text-xs font-medium hover:underline">Gửi nhắc nhở</button>
                          )}
                          {inv.status === 'paid' && (
                            <button className="text-gray-500 hover:text-gray-700 text-xs font-medium hover:underline">Xem chi tiết</button>
                          )}
                        </div>
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
