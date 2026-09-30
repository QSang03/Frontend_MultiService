'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ensureAuthReady } from '@/lib/auth/ensure-auth-ready';
import {
  Package,
  Clock,
  TrendingUp,
  CheckCircle2,
  Search,
  Filter,
  RefreshCw,
  Eye,
  ArrowRight,
  Download,
  AlertTriangle,
  Building2,
  User,
  ShieldCheck,
  Calendar,
  X,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils';
import { useToast } from '@/components/ui';

interface AdminOrder {
  id: string;
  title: string;
  description?: string;
  status: number;
  priority?: string;
  orgId?: string;
  creatorId?: string;
  assignedTechId?: string;
  assignedSaleId?: string;
  createdAt?: string;
  slaHours?: number;
  targetResolutionAt?: string;
  attributes?: string;
  estimatedPrice?: number;
}

const STATUS_MAP: Record<number, { label: string; color: string; badge: string; group: string }> = {
  1: { label: 'Bản nháp', color: 'text-gray-600', badge: 'bg-gray-100 text-gray-700 border-gray-200', group: 'pending' },
  2: { label: 'Chờ duyệt', color: 'text-amber-700', badge: 'bg-amber-50 text-amber-800 border-amber-200', group: 'pending' },
  3: { label: 'Mở / Chờ gán việc', color: 'text-blue-700', badge: 'bg-blue-50 text-blue-800 border-blue-200', group: 'in_progress' },
  4: { label: 'Đang báo giá', color: 'text-purple-700', badge: 'bg-purple-50 text-purple-800 border-purple-200', group: 'pending' },
  5: { label: 'Đã duyệt giá', color: 'text-indigo-700', badge: 'bg-indigo-50 text-indigo-800 border-indigo-200', group: 'in_progress' },
  6: { label: 'Đang điều phối', color: 'text-cyan-700', badge: 'bg-cyan-50 text-cyan-800 border-cyan-200', group: 'in_progress' },
  7: { label: 'Đang xử lý tại chỗ', color: 'text-amber-800', badge: 'bg-amber-100 text-amber-900 border-amber-300', group: 'in_progress' },
  8: { label: 'Chờ phụ tùng/RMA', color: 'text-orange-700', badge: 'bg-orange-50 text-orange-800 border-orange-200', group: 'in_progress' },
  9: { label: 'Đã giải quyết', color: 'text-emerald-700', badge: 'bg-emerald-50 text-emerald-800 border-emerald-200', group: 'completed' },
  10: { label: 'Đã đóng / Nghiệm thu', color: 'text-green-800', badge: 'bg-green-100 text-green-900 border-green-200', group: 'completed' },
  11: { label: 'Đã hủy', color: 'text-rose-700', badge: 'bg-rose-50 text-rose-800 border-rose-200', group: 'cancelled' },
};

export default function AdminOrdersPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'in_progress' | 'completed' | 'urgent'>('all');
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const authReady = await ensureAuthReady();
      if (!authReady) {
        router.replace('/login');
        return;
      }

      const res = await fetch('/api/admin/tickets?page_size=100');
      if (!res.ok) {
        throw new Error('Không thể tải danh sách đơn hàng');
      }

      const data = await res.json();
      const rawTickets: Record<string, unknown>[] = data.tickets || [];

      const mapped: AdminOrder[] = rawTickets.map((t) => {
        let estPrice = 0;
        if (t.attributes && typeof t.attributes === 'string') {
          try {
            const attrObj = JSON.parse(t.attributes) as Record<string, unknown>;
            if (attrObj.amount || attrObj.estimatedPrice || attrObj.totalAmount) {
              estPrice = Number(attrObj.amount || attrObj.estimatedPrice || attrObj.totalAmount) || 0;
            }
          } catch {
            // Ignore parse error
          }
        }

        return {
          id: String(t.id || ''),
          title: String(t.title || 'Đơn hàng kỹ thuật'),
          description: t.description ? String(t.description) : undefined,
          status: Number(t.status || 1),
          priority: t.priority ? String(t.priority) : 'NORMAL',
          orgId: t.orgId ? String(t.orgId) : undefined,
          creatorId: t.creatorId ? String(t.creatorId) : undefined,
          assignedTechId: t.assignedTechId ? String(t.assignedTechId) : undefined,
          assignedSaleId: t.assignedSaleId ? String(t.assignedSaleId) : undefined,
          createdAt: t.createdAt ? String(t.createdAt) : undefined,
          slaHours: t.slaHours ? Number(t.slaHours) : 24,
          targetResolutionAt: t.targetResolutionAt ? String(t.targetResolutionAt) : undefined,
          attributes: t.attributes ? String(t.attributes) : undefined,
          estimatedPrice: estPrice,
        };
      });

      setOrders(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi tải đơn hàng');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // KPI Calculations
  const totalCount = orders.length;
  const pendingCount = orders.filter((o) => [1, 2, 4].includes(o.status)).length;
  const inProgressCount = orders.filter((o) => [3, 5, 6, 7, 8].includes(o.status)).length;
  const completedCount = orders.filter((o) => [9, 10].includes(o.status)).length;

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Tab filter
      if (activeTab === 'pending' && ![1, 2, 4].includes(order.status)) return false;
      if (activeTab === 'in_progress' && ![3, 5, 6, 7, 8].includes(order.status)) return false;
      if (activeTab === 'completed' && ![9, 10].includes(order.status)) return false;
      if (activeTab === 'urgent' && !['HIGH', 'URGENT', 'CRITICAL'].includes(order.priority || '')) return false;

      // Search filter
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        order.id.toLowerCase().includes(q) ||
        order.title.toLowerCase().includes(q) ||
        (order.orgId && order.orgId.toLowerCase().includes(q)) ||
        (order.creatorId && order.creatorId.toLowerCase().includes(q)) ||
        (order.assignedTechId && order.assignedTechId.toLowerCase().includes(q)) ||
        (order.assignedSaleId && order.assignedSaleId.toLowerCase().includes(q))
      );
    });
  }, [orders, activeTab, searchQuery]);

  // Export CSV
  const handleExportCsv = () => {
    if (orders.length === 0) {
      addToast('Không có dữ liệu để xuất file', { type: 'error' });
      return;
    }

    const headers = ['Mã Đơn', 'Tiêu Đề Dịch Vụ', 'Tổ Chức / Khách Hàng', 'Trạng Thái', 'Ưu Tiên', 'KTV Phụ Trách', 'Sale Phụ Trách', 'SLA (Giờ)', 'Ngày Tạo'];
    const rows = filteredOrders.map((o) => [
      o.id,
      `"${o.title.replace(/"/g, '""')}"`,
      `"${o.orgId || o.creatorId || 'Khách vãng lai'}"`,
      STATUS_MAP[o.status]?.label || o.status,
      o.priority || 'NORMAL',
      o.assignedTechId || 'Chưa phân công',
      o.assignedSaleId || 'N/A',
      o.slaHours || 24,
      o.createdAt ? new Date(o.createdAt).toLocaleDateString('vi-VN') : '',
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `danh_sach_don_hang_admin_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Đã xuất file CSV đơn hàng thành công!', { type: 'success' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Quản Lý Đơn Hàng &amp; Dịch Vụ Hệ Thống
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Trung tâm theo dõi toàn diện đơn hàng, tiến độ xử lý hiện trường và cam kết SLA đa kênh.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchOrders}
            disabled={loading}
            className="p-2 border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors shadow-sm"
            title="Tải lại danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-4 py-2 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Download className="w-4 h-4 text-gray-500" />
            Xuất Báo Cáo CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tổng Đơn Hàng</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{totalCount}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Đơn hàng trong hệ thống</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-amber-200 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">Chờ Xử Lý / Báo Giá</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{pendingCount}</p>
            <p className="text-[11px] text-amber-700 mt-0.5">Cần phê duyệt &amp; thẩm định</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-indigo-200 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Đang Thực Hiện</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">{inProgressCount}</p>
            <p className="text-[11px] text-indigo-700 mt-0.5">KTV đang xử lý hiện trường</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-green-200 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-green-700 uppercase tracking-wider">Đã Hoàn Tất</p>
            <p className="text-2xl font-bold text-green-700 mt-1">{completedCount}</p>
            <p className="text-[11px] text-green-700 mt-0.5">Đã ký nghiệm thu số</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Filter and Search Bar */}
        <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-gray-50/50">
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { id: 'all', label: 'Tất cả', count: totalCount },
              { id: 'pending', label: 'Chờ duyệt / Báo giá', count: pendingCount },
              { id: 'in_progress', label: 'Đang thực hiện', count: inProgressCount },
              { id: 'completed', label: 'Đã hoàn tất', count: completedCount },
              { id: 'urgent', label: 'Ưu tiên cao / Gấp', count: orders.filter((o) => ['HIGH', 'URGENT', 'CRITICAL'].includes(o.priority || '')).length },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {tab.label} <span className="ml-1 opacity-80">({tab.count})</span>
              </button>
            ))}
          </div>

          <div className="relative min-w-[260px] flex-1 max-w-sm">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm mã đơn, tên dịch vụ, khách hàng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-red-50 border-b border-red-100 text-xs text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            {error}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/75 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-4">Mã Đơn / Ưu Tiên</th>
                <th className="py-3 px-4">Tên Dịch Vụ / Yêu Cầu</th>
                <th className="py-3 px-4">Khách Hàng / Đơn Vị</th>
                <th className="py-3 px-4">Phụ Trách (Tech / Sale)</th>
                <th className="py-3 px-4 text-center">Cam Kết SLA</th>
                <th className="py-3 px-4 text-center">Trạng Thái</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading && orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                    Đang tải danh sách đơn hàng toàn hệ thống...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 text-xs">
                    Không tìm thấy đơn hàng nào phù hợp với điều kiện tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const statusInfo = STATUS_MAP[order.status] || {
                    label: `Trạng thái ${order.status}`,
                    badge: 'bg-gray-100 text-gray-700 border-gray-200',
                  };
                  const isHighPriority = ['HIGH', 'URGENT', 'CRITICAL'].includes(order.priority || '');

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50/60 transition-colors cursor-pointer"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-blue-600 text-xs">
                            #{order.id.slice(0, 8)}
                          </span>
                          {isHighPriority && (
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                          )}
                        </div>
                        <span
                          className={`inline-block text-[10px] font-bold px-1.5 py-0.2 rounded mt-0.5 uppercase ${
                            isHighPriority
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {order.priority || 'NORMAL'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-bold text-gray-900 text-xs line-clamp-1">{order.title}</div>
                        {order.description && (
                          <div className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
                            {order.description}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-800">
                          {order.orgId ? (
                            <>
                              <Building2 className="w-3.5 h-3.5 text-gray-400" />
                              <span className="truncate max-w-[140px]">{order.orgId}</span>
                            </>
                          ) : (
                            <>
                              <User className="w-3.5 h-3.5 text-gray-400" />
                              <span className="truncate max-w-[140px]">{order.creatorId || 'Khách vãng lai'}</span>
                            </>
                          )}
                        </div>
                        {order.createdAt && (
                          <span className="text-[10px] text-gray-400 block mt-0.5">
                            Ngày tạo: {formatDate(order.createdAt)}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-xs">
                        <div className="text-gray-700 flex items-center gap-1">
                          <span className="font-semibold text-[11px]">KTV:</span>
                          <span className="text-[11px] truncate max-w-[100px]">
                            {order.assignedTechId || 'Chưa gán'}
                          </span>
                        </div>
                        <div className="text-gray-500 flex items-center gap-1 text-[10px]">
                          <span>Sale:</span>
                          <span className="truncate max-w-[100px]">{order.assignedSaleId || 'N/A'}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1 text-xs font-mono font-bold text-gray-700">
                          <Clock className="w-3.5 h-3.5 text-blue-500" />
                          {order.slaHours}h
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusInfo.badge}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(order)}
                            className="p-1.5 border border-gray-200 hover:bg-gray-100 text-gray-600 rounded-lg text-xs transition-colors"
                            title="Xem chi tiết đơn hàng"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => router.push(`/admin/tickets`)}
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                            title="Mở trong phân hệ Điều Phối Admin Tickets"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer: Order Detail */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-end">
          <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-mono font-bold text-xs">
                  ORD
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">
                    Chi Tiết Đơn Hàng #{selectedOrder.id.slice(0, 8)}
                  </h3>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border mt-0.5 ${
                      STATUS_MAP[selectedOrder.status]?.badge || 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {STATUS_MAP[selectedOrder.status]?.label || selectedOrder.status}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-2 text-gray-400 hover:text-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-gray-500 uppercase tracking-wider text-[10px]">
                  Tiêu Đề Dịch Vụ
                </label>
                <p className="font-bold text-sm text-gray-900 leading-relaxed">{selectedOrder.title}</p>
              </div>

              {selectedOrder.description && (
                <div className="space-y-1">
                  <label className="font-bold text-gray-500 uppercase tracking-wider text-[10px]">
                    Mô Tả Yêu Cầu Kỹ Thuật
                  </label>
                  <p className="text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-200">
                    {selectedOrder.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-blue-50/40 border border-blue-100">
                <div>
                  <span className="text-gray-500 block text-[10px] uppercase font-bold">Mức Độ Ưu Tiên</span>
                  <span className="font-bold text-blue-900 text-xs mt-0.5 block">{selectedOrder.priority || 'NORMAL'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px] uppercase font-bold">Cam Kết SLA</span>
                  <span className="font-bold text-blue-900 text-xs mt-0.5 block">{selectedOrder.slaHours} Giờ</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px] uppercase font-bold">Kỹ Thuật Viên</span>
                  <span className="font-medium text-gray-800 text-xs mt-0.5 block">
                    {selectedOrder.assignedTechId || 'Chưa phân công'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px] uppercase font-bold">Nhân Viên Sale</span>
                  <span className="font-medium text-gray-800 text-xs mt-0.5 block">
                    {selectedOrder.assignedSaleId || 'N/A'}
                  </span>
                </div>
              </div>

              {selectedOrder.estimatedPrice != null && selectedOrder.estimatedPrice > 0 && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                  <span className="font-bold text-emerald-900 text-xs">Giá Trị Ước Tính:</span>
                  <span className="font-mono font-bold text-emerald-800 text-sm">
                    {formatCurrency(selectedOrder.estimatedPrice)}
                  </span>
                </div>
              )}

              {selectedOrder.createdAt && (
                <div className="text-gray-500 text-[11px] pt-2 border-t">
                  Thời gian tiếp nhận: {new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-100 transition-colors"
              >
                Đóng
              </button>

              <button
                type="button"
                onClick={() => router.push(`/admin/tickets`)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <span>Mở Trong Quản Trị Ticket</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
