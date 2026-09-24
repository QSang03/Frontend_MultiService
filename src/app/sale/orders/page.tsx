'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ensureAuthReady } from '@/lib/auth/ensure-auth-ready';
import {
  ShoppingCart, Search, Eye, Package, Clock, TrendingUp,
  CheckCircle2, X, RefreshCw, ChevronUp, ChevronDown,
} from 'lucide-react';
import { useToast } from '@/components/ui';

interface Order {
  id: string;
  customer: string;
  service: string;
  status: 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled';
  createdAt: string;
  createdAtRaw: number;
  priority?: string;
}

type SortField = 'id' | 'customer' | 'service' | 'status' | 'createdAt';
type SortDir = 'asc' | 'desc';

const STATUS_ORDER: Record<Order['status'], number> = {
  pending: 0, confirmed: 1, processing: 2, completed: 3, cancelled: 4,
};

const STATUS_MAP: Record<number, Order['status']> = {
  1: 'pending',     // DRAFT
  3: 'confirmed',   // OPEN
  5: 'confirmed',   // AGREED
  7: 'processing',  // IN_PROGRESS
  9: 'completed',   // RESOLVED
  10: 'completed',  // CLOSED
};

const statusConfig: Record<Order['status'], { label: string; color: string; dot: string }> = {
  pending:    { label: 'Chờ xử lý',   color: 'bg-amber-100 text-amber-700',    dot: 'bg-amber-400' },
  confirmed:  { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-700',      dot: 'bg-blue-400' },
  processing: { label: 'Đang xử lý',  color: 'bg-violet-100 text-violet-700',  dot: 'bg-violet-400' },
  completed:  { label: 'Hoàn thành',  color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-400' },
  cancelled:  { label: 'Đã hủy',      color: 'bg-red-100 text-red-700',        dot: 'bg-red-400' },
};

const kpiDefs = [
  { key: 'total',      label: 'Tổng đơn hàng', gradient: 'from-blue-500 to-indigo-600',   icon: Package,      sub: 'trong hệ thống' },
  { key: 'pending',    label: 'Chờ xử lý',    gradient: 'from-amber-500 to-orange-500',   icon: Clock,        sub: 'cần xử lý' },
  { key: 'processing', label: 'Đang xử lý',   gradient: 'from-violet-500 to-purple-600',  icon: TrendingUp,   sub: 'đang tiến hành' },
  { key: 'completed',  label: 'Hoàn thành',   gradient: 'from-emerald-500 to-teal-600',   icon: CheckCircle2, sub: 'tháng này' },
] as const;

const filterTabs = [
  { key: 'all',        label: 'Tất cả' },
  { key: 'pending',    label: 'Chờ xử lý' },
  { key: 'confirmed',  label: 'Đã xác nhận' },
  { key: 'processing', label: 'Đang xử lý' },
  { key: 'completed',  label: 'Hoàn thành' },
  { key: 'cancelled',  label: 'Đã hủy' },
];

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-50 animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <div className="h-4 bg-gray-100 rounded w-3/4" />
        </td>
      ))}
    </tr>
  );
}

export default function SaleOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [drawerMounting, setDrawerMounting] = useState(false);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const { addToast } = useToast();

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const authReady = await ensureAuthReady();
      if (!authReady) { router.replace('/login'); return; }
      const res = await fetch('/api/sale/tickets?page_size=50');
      if (!res.ok) throw new Error('Không thể tải dữ liệu');
      const data = await res.json();
      const mapped: Order[] = (data.tickets ?? []).map((t: Record<string, unknown>) => ({
        id: String(t.id ?? ''),
        customer: String(t.creatorId ?? t.orgId ?? 'Khách hàng'),
        service: String(t.title ?? 'Dịch vụ'),
        status: STATUS_MAP[Number(t.status)] ?? 'pending',
        createdAt: t.createdAt
          ? new Date(String(t.createdAt)).toLocaleDateString('vi-VN')
          : '—',
        createdAtRaw: t.createdAt ? new Date(String(t.createdAt)).getTime() : 0,
        priority: t.priority as string | undefined,
      }));
      setOrders(mapped);
    } catch {
      addToast('Không thể tải danh sách đơn hàng.', { type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [addToast, router]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const filtered = orders.filter((o) => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!o.id.toLowerCase().includes(q) && !o.customer.toLowerCase().includes(q) && !o.service.toLowerCase().includes(q)) return false;
    }
    return true;
  }).sort((a, b) => {
    let cmp = 0;
    if (sortField === 'createdAt') cmp = a.createdAtRaw - b.createdAtRaw;
    else if (sortField === 'status') cmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    else cmp = a[sortField].localeCompare(b[sortField], 'vi');
    return sortDir === 'asc' ? cmp : -cmp;
  });

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('asc'); }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ChevronUp className="w-3 h-3 text-gray-300 ml-1 inline" />;
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 text-emerald-500 ml-1 inline" />
      : <ChevronDown className="w-3 h-3 text-emerald-500 ml-1 inline" />;
  }

  const counts = {
    total:      orders.length,
    pending:    orders.filter((o) => o.status === 'pending').length,
    processing: orders.filter((o) => o.status === 'processing').length,
    completed:  orders.filter((o) => o.status === 'completed').length,
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Quản lý đơn hàng
          </h1>
          <p className="text-gray-500 text-sm mt-1">Theo dõi và quản lý đơn hàng kinh doanh</p>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl font-medium text-sm shadow-sm hover:bg-gray-50 transition-all"
          aria-label="Làm mới danh sách"
        >
          <RefreshCw className="w-4 h-4" />
          Làm mới
        </button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiDefs.map((k) => {
          const Icon = k.icon;
          const value = counts[k.key];
          return (
            <div key={k.key} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-4">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${k.gradient} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                {loading ? (
                  <div className="h-6 w-8 bg-gray-100 rounded animate-pulse mb-1" />
                ) : (
                  <p className="text-2xl font-bold text-gray-800">{value}</p>
                )}
                <p className="text-xs text-gray-500 mt-0.5">{k.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter tabs + search */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === tab.key
                  ? 'bg-emerald-600 text-white shadow-sm'
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
            placeholder="Tìm mã đơn, khách hàng, dịch vụ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-1/3" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
              <ShoppingCart className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-gray-600 font-medium text-sm">
              {search || statusFilter !== 'all' ? 'Không tìm thấy đơn hàng phù hợp' : 'Chưa có đơn hàng nào'}
            </p>
            <p className="text-gray-400 text-xs text-center px-6">
              {search || statusFilter !== 'all' ? 'Thử thay đổi bộ lọc hoặc từ khóa' : 'Đơn hàng sẽ xuất hiện khi khách hàng xác nhận báo giá.'}
            </p>
          </div>
        ) : (
          filtered.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-mono text-xs text-gray-500 truncate">{order.id}</p>
                  <p className="font-semibold text-gray-800 mt-0.5 truncate">{order.service}</p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{order.customer}</p>
                </div>
                <button
                  onClick={() => setSelectedOrder(order)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                  aria-label={`Xem chi tiết đơn ${order.id}`}
                >
                  <Eye className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${statusConfig[order.status].color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[order.status].dot}`} />
                  {statusConfig[order.status].label}
                </span>
                <span className="text-xs text-gray-400">{order.createdAt}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="text-left px-6 py-3.5 font-medium text-gray-500 text-xs uppercase tracking-wide"><button onClick={() => toggleSort('id')} className="flex items-center hover:text-gray-700 transition-colors">Mã đơn<SortIcon field="id" /></button></th>
                <th className="text-left px-6 py-3.5 font-medium text-gray-500 text-xs uppercase tracking-wide"><button onClick={() => toggleSort('customer')} className="flex items-center hover:text-gray-700 transition-colors">Khách hàng<SortIcon field="customer" /></button></th>
                <th className="text-left px-6 py-3.5 font-medium text-gray-500 text-xs uppercase tracking-wide"><button onClick={() => toggleSort('service')} className="flex items-center hover:text-gray-700 transition-colors">Dịch vụ<SortIcon field="service" /></button></th>
                <th className="text-left px-6 py-3.5 font-medium text-gray-500 text-xs uppercase tracking-wide"><button onClick={() => toggleSort('status')} className="flex items-center hover:text-gray-700 transition-colors">Trạng thái<SortIcon field="status" /></button></th>
                <th className="text-left px-6 py-3.5 font-medium text-gray-500 text-xs uppercase tracking-wide"><button onClick={() => toggleSort('createdAt')} className="flex items-center hover:text-gray-700 transition-colors">Ngày tạo<SortIcon field="createdAt" /></button></th>
                <th className="text-left px-6 py-3.5 font-medium text-gray-500 text-xs uppercase tracking-wide">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-20">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                        <ShoppingCart className="w-8 h-8 text-gray-300" />
                      </div>
                      <p className="text-gray-600 font-medium">
                        {search || statusFilter !== 'all' ? 'Không tìm thấy đơn hàng phù hợp' : 'Chưa có đơn hàng nào'}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {search || statusFilter !== 'all' ? 'Thử thay đổi bộ lọc hoặc từ khóa' : 'Đơn hàng sẽ xuất hiện khi khách hàng xác nhận báo giá.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((order) => (
                  <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-gray-600">{order.id}</td>
                    <td className="px-6 py-4 font-medium text-gray-800">{order.customer}</td>
                    <td className="px-6 py-4 text-gray-600 max-w-[200px] truncate">{order.service}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${statusConfig[order.status].color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[order.status].dot}`} />
                        {statusConfig[order.status].label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">{order.createdAt}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => { setDrawerMounting(true); setSelectedOrder(order); setTimeout(() => setDrawerMounting(false), 250); }}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                        aria-label={`Xem chi tiết đơn ${order.id}`}
                      >
                        <Eye className="w-4 h-4 text-gray-500" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Drawer */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedOrder(null)} />
          <div className="relative ml-auto w-full max-w-sm bg-white shadow-2xl h-full overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-semibold text-gray-900">Chi tiết đơn hàng</h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 hover:bg-gray-100 rounded-lg"
                aria-label="Đóng"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            {drawerMounting ? (
              <div className="p-6 space-y-4 animate-pulse">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i}>
                    <div className="h-3 w-1/4 bg-gray-100 rounded mb-2" />
                    <div className="h-5 w-3/4 bg-gray-100 rounded" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Mã đơn</p>
                  <p className="font-mono text-sm font-medium text-gray-800">{selectedOrder.id}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Khách hàng</p>
                  <p className="text-sm text-gray-800">{selectedOrder.customer}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Dịch vụ</p>
                  <p className="text-sm text-gray-800">{selectedOrder.service}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Trạng thái</p>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${statusConfig[selectedOrder.status].color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[selectedOrder.status].dot}`} />
                    {statusConfig[selectedOrder.status].label}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Ngày tạo</p>
                  <p className="text-sm text-gray-800">{selectedOrder.createdAt}</p>
                </div>
                {selectedOrder.priority && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Độ ưu tiên</p>
                    <p className="text-sm text-gray-800">{selectedOrder.priority}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
