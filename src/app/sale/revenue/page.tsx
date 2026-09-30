'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  TrendingUp,
  FileText,
  Loader2,
  X,
  Receipt,
  Layers,
  Sparkles,
  Shield,
  Calendar,
  Check
} from 'lucide-react';
import CreateInvoiceModal from './CreateInvoiceModal';
import { useToast } from '@/components/ui';
import axiosInstance from '@/lib/axios';

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

interface NewTierCommission {
  id: string;
  contractNo: string;
  client: string;
  serviceType: string;
  date: string;
  baseProfit: number;
  tier: string;
  rate: number;
  commission: number;
  status: 'AVAILABLE' | 'PROVISIONAL';
}

interface RecurringCommission {
  id: string;
  contractNo: string;
  client: string;
  periodMonth: number;
  billingCycle: string;
  periodProfit: number;
  retentionRate: number; // 5% standard fixed
  commission: number;
  status: 'AVAILABLE' | 'PROVISIONAL';
}

const INITIAL_INVOICES: Invoice[] = [];
const INITIAL_TIER_COMMISSIONS: NewTierCommission[] = [];
const INITIAL_RECURRING_COMMISSIONS: RecurringCommission[] = [];

const statusConfig: Record<string, { label: string; color: string; dot: string; icon: React.ReactNode }> = {
  paid: { label: 'Đã thanh toán', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-400', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  pending_verification: { label: 'Chờ xác nhận', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400', icon: <Clock className="w-3.5 h-3.5" /> },
  overdue: { label: 'Quá hạn', color: 'bg-red-100 text-red-700', dot: 'bg-red-400', icon: <AlertCircle className="w-3.5 h-3.5" /> },
};

export default function RevenuePage() {
  const [activeMainTab, setActiveMainTab] = useState<'invoices' | 'commissions'>('commissions');
  const [invoices, setInvoices] = useState(INITIAL_INVOICES);
  const [tierCommissions, setTierCommissions] = useState<NewTierCommission[]>(INITIAL_TIER_COMMISSIONS);
  const [recurringCommissions, setRecurringCommissions] = useState<RecurringCommission[]>(INITIAL_RECURRING_COMMISSIONS);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [reminderSendingId, setReminderSendingId] = useState<string | null>(null);
  const [reminderConfirmInv, setReminderConfirmInv] = useState<Invoice | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    async function loadCommissions() {
      try {
        const res = await fetch('/api/sale/commissions');
        if (res.ok) {
          const json = await res.json();
          const list = json.data?.commissions || [];
          if (list.length > 0) {
            const newTier: NewTierCommission[] = [];
            const recurring: RecurringCommission[] = [];
            list.forEach((item: Record<string, unknown>, idx: number) => {
              const isRecurring = item.commissionType === 'RECURRING' || Boolean(item.billingCycle);
              if (isRecurring) {
                recurring.push({
                  id: String(item.id || `COM-REC-${idx}`),
                  contractNo: String(item.contractNumber || item.contractNo || 'HD-REC'),
                  client: String(item.customerName || item.client || 'Khách hàng Doanh nghiệp'),
                  periodMonth: Number(item.periodMonth || 1),
                  billingCycle: String(item.billingCycle || 'Kỳ Tháng hiện tại'),
                  periodProfit: Number(item.profitAmount || item.baseProfit || 0),
                  retentionRate: Number(item.rate || 0.05),
                  commission: Number(item.commissionAmount || 0),
                  status: (item.status === 'PAID' || item.status === 'AVAILABLE') ? 'AVAILABLE' : 'PROVISIONAL',
                });
              } else {
                newTier.push({
                  id: String(item.id || `COM-NEW-${idx}`),
                  contractNo: String(item.contractNumber || item.contractNo || 'HD-NEW'),
                  client: String(item.customerName || item.client || 'Khách hàng Doanh nghiệp'),
                  serviceType: String(item.serviceType || 'Dịch vụ CNTT & Bảo trì'),
                  date: item.createdAt ? new Date(String(item.createdAt)).toLocaleDateString('vi-VN') : 'Hôm nay',
                  baseProfit: Number(item.profitAmount || item.baseProfit || 0),
                  tier: String(item.tier || 'Tier 1 (Cơ bản)'),
                  rate: Number(item.rate || 0.1),
                  commission: Number(item.commissionAmount || 0),
                  status: (item.status === 'PAID' || item.status === 'AVAILABLE') ? 'AVAILABLE' : 'PROVISIONAL',
                });
              }
            });
            setTierCommissions(newTier);
            setRecurringCommissions(recurring);
          } else {
            setTierCommissions([]);
            setRecurringCommissions([]);
          }
        }
      } catch {
        // empty fallback
      }
    }

    async function loadInvoices() {
      try {
        const res = await fetch('/api/contracts?pageSize=50');
        if (res.ok) {
          const json = await res.json();
          const contracts = json.data?.contracts || [];
          setInvoices(contracts.map((c: Record<string, unknown>, idx: number) => {
            const statusNum = Number(c.status || 0);
            return {
              id: String(c.contractNumber || c.id || `HD-${idx + 1}`),
              client: String(c.customerName || c.title || 'Khách hàng Doanh nghiệp'),
              amount: Number(c.totalValue || c.value || 0),
              dueDate: c.endDate ? String(c.endDate).slice(0, 10) : '—',
              status: statusNum === 2 ? 'paid' : statusNum === 1 ? 'pending_verification' : 'overdue',
              createdBy: String(c.creatorName || 'Sale phụ trách'),
              updatedAt: String(c.updatedAt || new Date().toISOString()),
            };
          }));
        }
      } catch (err) {
        console.error('[revenue] Error loading contracts/invoices:', err);
      }
    }

    loadCommissions();
    loadInvoices();
  }, []);

  const handleConfirmSlip = async (inv: Invoice) => {
    setConfirmingId(inv.id);
    try {
      await axiosInstance.put(`/invoices/${inv.id}/confirm`);
      setInvoices(prev => prev.map(i => i.id === inv.id ? { ...i, status: 'paid' } : i));
      addToast(`Đã xác nhận slip cho ${inv.client}`, { type: 'success' });
    } catch {
      addToast(`Xác nhận slip thất bại cho ${inv.client}`, { type: 'error' });
    } finally {
      setConfirmingId(null);
    }
  };

  const handleSendReminder = async (inv: Invoice) => {
    setReminderConfirmInv(inv);
  };

  const confirmSendReminder = async (inv: Invoice) => {
    setReminderConfirmInv(null);
    setReminderSendingId(inv.id);
    try {
      await axiosInstance.post(`/invoices/${inv.id}/reminder`);
      addToast(`Đã gửi nhắc nhở thanh toán cho ${inv.client}`, { type: 'success' });
    } catch {
      addToast(`Gửi nhắc nhở thất bại cho ${inv.client}`, { type: 'error' });
    } finally {
      setReminderSendingId(null);
    }
  };

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

  const pendingAmt = invoices.filter(i => i.status === 'pending_verification').reduce((s, i) => s + i.amount, 0);
  const overdueAmt = invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + i.amount, 0);
  const collectedAmt = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0);

  // Calculations for Commissions tab
  const totalTierComms = tierCommissions.reduce((s, c) => s + c.commission, 0);
  const totalRecComms = recurringCommissions.reduce((s, c) => s + c.commission, 0);
  const carryForwardClawback = 2000000; // 2M carried forward due to 30% MTD cap
  const netEarnings = totalTierComms + totalRecComms - carryForwardClawback;
  const kpis = [
    { label: 'Chờ xác nhận', value: fmt(pendingAmt), sub: `${invoices.filter(i => i.status === 'pending_verification').length} hóa đơn`, gradient: 'from-amber-500 to-orange-500', icon: Clock },
    { label: 'Nợ quá hạn', value: fmt(overdueAmt), sub: 'Cần xử lý ngay', gradient: 'from-rose-500 to-red-600', icon: AlertCircle },
    { label: 'Đã thu tháng này', value: fmt(collectedAmt), sub: 'Tiếp tục phát huy!', gradient: 'from-emerald-500 to-teal-600', icon: TrendingUp },
    { label: 'Tổng hóa đơn', value: String(invoices.length), sub: 'trong hệ thống', gradient: 'from-blue-500 to-indigo-600', icon: FileText },
  ];

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Top Main Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Doanh Thu & Hoa Hồng (SRS III.4)
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Quản lý bảng kê hóa đơn và theo dõi chi tiết 2 cấu trúc hoa hồng: Gói mới (Tier) & Duy trì (Recurring).
          </p>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveMainTab('commissions')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeMainTab === 'commissions'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            <Sparkles className="w-4 h-4" />
            Hoa Hồng Doanh Số (SRS III.4)
          </button>
          <button
            onClick={() => setActiveMainTab('invoices')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeMainTab === 'invoices'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            <Receipt className="w-4 h-4" />
            Hóa Đơn & Thu Tiền
          </button>
        </div>
      </div>

      {/* ================= COMMISSIONS TAB (SPRINT 3.2 REQUIREMENT) ================= */}
      {activeMainTab === 'commissions' && (
        <div className="space-y-6">
          {/* KPI Cards for Commissions */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase text-gray-400">Hoa hồng Gói mới (Tier)</span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{fmt(totalTierComms)}</p>
              <p className="text-xs text-blue-600 mt-1 font-medium">Lũy tiến: Tier 1 (10%) → Tier 3 (20%)</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase text-gray-400">Hoa hồng Duy trì (Recurring)</span>
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-purple-700">{fmt(totalRecComms)}</p>
              <p className="text-xs text-purple-600 mt-1 font-medium">Tỷ lệ cố định 5% từ Tháng thứ 2+</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase text-gray-400">Nợ Truy thu Treo (30% Cap)</span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-amber-600">-{fmt(carryForwardClawback)}</p>
              <p className="text-xs text-amber-700 mt-1 font-medium">Bảo vệ trần 30% MTD, chuyển kỳ sau</p>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white shadow-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase opacity-80">Thực lĩnh kỳ này</span>
                <DollarSign className="w-5 h-5 opacity-90" />
              </div>
              <p className="text-2xl font-bold">{fmt(netEarnings)}</p>
              <p className="text-xs opacity-80 mt-1">Dự kiến thanh toán ngày 25 hàng tháng</p>
            </div>
          </div>

          {/* TABLE 1: NEW PACKAGE COMMISSIONS (TIER PERFORMANCE) */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
              <div>
                <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  Bảng 1: Hoa Hồng Gói Mới / Dự Án Mới (Tier Performance Model)
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Áp dụng cho Hợp đồng ký mới và Tháng đầu tiên: Tỷ lệ hoa hồng nhảy bậc theo lũy kế lợi nhuận tháng (Tier 1: 10%, Tier 2: 15%, Tier 3: 20%).
                </p>
              </div>
              <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-semibold">
                {tierCommissions.length} Hợp đồng
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50/80 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase">
                  <tr>
                    <th className="px-6 py-3.5">Mã Hợp Đồng</th>
                    <th className="px-6 py-3.5">Khách Hàng</th>
                    <th className="px-6 py-3.5">Dịch Vụ Triển Khai</th>
                    <th className="px-6 py-3.5">Ngày Nghiệm Thu</th>
                    <th className="px-6 py-3.5 text-right">Lợi Nhuận Ròng</th>
                    <th className="px-6 py-3.5 text-center">Bậc Áp Dụng</th>
                    <th className="px-6 py-3.5 text-right">Hoa Hồng</th>
                    <th className="px-6 py-3.5 text-center">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {tierCommissions.map((item) => (
                    <tr key={item.id} className="hover:bg-blue-50/20 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs font-bold text-blue-600">{item.contractNo}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">{item.client}</td>
                      <td className="px-6 py-4 text-xs text-gray-600">{item.serviceType}</td>
                      <td className="px-6 py-4 text-xs text-gray-500">{item.date}</td>
                      <td className="px-6 py-4 text-right font-mono font-semibold text-gray-800">{fmt(item.baseProfit)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {item.tier} ({(item.rate * 100).toFixed(0)}%)
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-green-600">{fmt(item.commission)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${item.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                          {item.status === 'AVAILABLE' ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {item.status === 'AVAILABLE' ? 'Đã Chốt' : 'Tạm Tính'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* TABLE 2: RECURRING RETENTION COMMISSIONS */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-purple-50/40">
              <div>
                <h3 className="font-bold text-purple-950 text-base flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-600" />
                  Bảng 2: Hoa Hồng Duy Trì Hợp Đồng (Recurring Retention Model)
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Theo chuẩn SRS III.4: Từ tháng thứ 2 trở đi, áp dụng tỷ lệ cố định 5% trên lợi nhuận thực tế định kỳ nhằm duy trì chăm sóc khách hàng dài hạn.
                </p>
              </div>
              <span className="text-xs bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-semibold">
                {recurringCommissions.length} Hợp đồng duy trì
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50/80 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase">
                  <tr>
                    <th className="px-6 py-3.5">Mã Hợp Đồng</th>
                    <th className="px-6 py-3.5">Khách Hàng</th>
                    <th className="px-6 py-3.5 text-center">Tuổi Hợp Đồng</th>
                    <th className="px-6 py-3.5">Kỳ Thanh Toán</th>
                    <th className="px-6 py-3.5 text-right">Lợi Nhuận Kỳ</th>
                    <th className="px-6 py-3.5 text-center">Tỷ Lệ Duy Trì (Fixed)</th>
                    <th className="px-6 py-3.5 text-right">Hoa Hồng Duy Trì</th>
                    <th className="px-6 py-3.5 text-center">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recurringCommissions.map((item) => (
                    <tr key={item.id} className="hover:bg-purple-50/20 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs font-bold text-purple-700">{item.contractNo}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">{item.client}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-gray-100 text-gray-700">
                          Tháng thứ {item.periodMonth}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-600">{item.billingCycle}</td>
                      <td className="px-6 py-4 text-right font-mono font-semibold text-gray-800">{fmt(item.periodProfit)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          {(item.retentionRate * 100).toFixed(0)}% cố định
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-purple-700">{fmt(item.commission)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${item.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                          {item.status === 'AVAILABLE' ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {item.status === 'AVAILABLE' ? 'Đã Chốt' : 'Tạm Tính'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= INVOICES TAB (ORIGINAL VIEW) ================= */}
      {activeMainTab === 'invoices' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Danh Sách Hóa Đơn & Phiếu Thu</h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2.5 rounded-xl font-medium text-sm shadow-sm hover:shadow-md hover:from-blue-600 hover:to-indigo-700 transition-all"
            >
              <Plus className="w-4 h-4" />
              Tạo Hóa Đơn
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
              {[
                { key: 'all', label: 'Tất cả' },
                { key: 'pending_verification', label: 'Chờ xác nhận' },
                { key: 'paid', label: 'Đã thanh toán' },
                { key: 'overdue', label: 'Quá hạn' },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === tab.key
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
                                onClick={() => handleConfirmSlip(inv)}
                                disabled={confirmingId === inv.id}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium shadow-sm transition-colors disabled:opacity-50"
                              >
                                {confirmingId === inv.id ? 'Đang duyệt...' : 'Duyệt Slip'}
                              </button>
                            )}
                            {inv.status === 'overdue' && (
                              <button
                                onClick={() => handleSendReminder(inv)}
                                disabled={reminderSendingId === inv.id}
                                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium shadow-sm transition-colors disabled:opacity-50"
                              >
                                {reminderSendingId === inv.id ? 'Đang gửi...' : 'Nhắc nợ'}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-gray-400 text-sm">
                        Không tìm thấy hóa đơn nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Reminder Modal */}
      {reminderConfirmInv && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-gray-900 text-base">Gửi thông báo nhắc nợ</h3>
            <p className="text-sm text-gray-600">
              Bạn có chắc muốn gửi email nhắc nợ cho <span className="font-semibold text-gray-800">{reminderConfirmInv.client}</span> với số tiền <span className="font-semibold text-rose-600">{fmt(reminderConfirmInv.amount)}</span>?
            </p>
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setReminderConfirmInv(null)}
                className="px-4 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => confirmSendReminder(reminderConfirmInv)}
                className="px-4 py-2 rounded-xl text-sm bg-rose-600 hover:bg-rose-700 text-white font-medium shadow-sm transition-colors"
              >
                Xác nhận gửi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateInvoiceModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
}