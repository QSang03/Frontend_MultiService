'use client';

import { useState } from 'react';
import { ShoppingCart, Search, Plus, Eye, Edit, MoreHorizontal, Package, Clock, TrendingUp, CheckCircle2 } from 'lucide-react';

interface Order {
  id: string;
  customer: string;
  service: string;
  amount: string;
  status: 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled';
  createdAt: string;
}

const statusConfig = {
  pending:    { label: 'Chờ xử lý',   color: 'bg-amber-100 text-amber-700',    dot: 'bg-amber-400' },
  confirmed:  { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-700',      dot: 'bg-blue-400' },
  processing: { label: 'Đang xử lý',  color: 'bg-violet-100 text-violet-700',  dot: 'bg-violet-400' },
  completed:  { label: 'Hoàn thành',  color: 'bg-emerald-100 text-emerald-700',dot: 'bg-emerald-400' },
  cancelled:  { label: 'Đã hủy',      color: 'bg-red-100 text-red-700',        dot: 'bg-red-400' },
};

const kpis = [
  { label: 'Tổng đơn hàng', gradient: 'from-blue-500 to-indigo-600',    icon: Package,      sub: 'trong hệ thống' },
  { label: 'Chờ xử lý',    gradient: 'from-amber-500 to-orange-500',    icon: Clock,         sub: 'cần xử lý' },
  { label: 'Đang xử lý',   gradient: 'from-violet-500 to-purple-600',   icon: TrendingUp,    sub: 'đang tiến hành' },
  { label: 'Hoàn thành',   gradient: 'from-emerald-500 to-teal-600',    icon: CheckCircle2,  sub: 'tháng này' },
];

const filterTabs = [
  { key: 'all',        label: 'Tất cả' },
  { key: 'pending',    label: 'Chờ xử lý' },
  { key: 'confirmed',  label: 'Đã xác nhận' },
  { key: 'processing', label: 'Đang xử lý' },
  { key: 'completed',  label: 'Hoàn thành' },
  { key: 'cancelled',  label: 'Đã hủy' },
];

export default function SaleOrdersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const orders: Order[] = [];

  const filtered = orders.filter(o => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (search && !o.id.toLowerCase().includes(search.toLowerCase()) && !o.customer.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = {
    total:      orders.length,
    pending:    orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    completed:  orders.filter(o => o.status === 'completed').length,
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
        <button className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-2.5 rounded-xl font-medium text-sm shadow-sm hover:shadow-md hover:from-emerald-600 hover:to-teal-700 transition-all">
          <Plus className="w-4 h-4" />
          Tạo đơn hàng
        </button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => {
          const Icon = k.icon;
          const value = [counts.total, counts.pending, counts.processing, counts.completed][i];
          return (
            <div key={k.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-4">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${k.gradient} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{k.label}</p>
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
            placeholder="Tìm mã đơn, khách hàng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/80">
              <th className="text-left px-6 py-3.5 font-medium text-gray-500 text-xs uppercase tracking-wide">Mã đơn</th>
              <th className="text-left px-6 py-3.5 font-medium text-gray-500 text-xs uppercase tracking-wide">Khách hàng</th>
              <th className="text-left px-6 py-3.5 font-medium text-gray-500 text-xs uppercase tracking-wide">Dịch vụ</th>
              <th className="text-left px-6 py-3.5 font-medium text-gray-500 text-xs uppercase tracking-wide">Tổng tiền</th>
              <th className="text-left px-6 py-3.5 font-medium text-gray-500 text-xs uppercase tracking-wide">Trạng thái</th>
              <th className="text-left px-6 py-3.5 font-medium text-gray-500 text-xs uppercase tracking-wide">Ngày tạo</th>
              <th className="text-left px-6 py-3.5 font-medium text-gray-500 text-xs uppercase tracking-wide">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-20">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                      <ShoppingCart className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="text-gray-600 font-medium">Chưa có đơn hàng nào</p>
                    <p className="text-gray-400 text-xs">Tạo đơn hàng đầu tiên để bắt đầu theo dõi</p>
                    <button className="mt-2 flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-medium hover:bg-emerald-700 transition-colors">
                      <Plus className="w-3.5 h-3.5" /> Tạo đơn hàng
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((order) => (
                <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-gray-600">{order.id}</td>
                  <td className="px-6 py-4 font-medium text-gray-800">{order.customer}</td>
                  <td className="px-6 py-4 text-gray-600">{order.service}</td>
                  <td className="px-6 py-4 font-semibold text-gray-800">{order.amount}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${statusConfig[order.status].color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[order.status].dot}`} />
                      {statusConfig[order.status].label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs">{order.createdAt}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><Eye className="w-4 h-4 text-gray-500" /></button>
                      <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><Edit className="w-4 h-4 text-gray-500" /></button>
                      <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><MoreHorizontal className="w-4 h-4 text-gray-500" /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Placeholder order data structure
interface Order {
  id: string;
  customer: string;
  service: string;
  amount: string;
  status: 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled';
  createdAt: string;
}

const statusConfig = {
  pending: { label: 'Chờ xử lý', color: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-800' },
  processing: { label: 'Đang xử lý', color: 'bg-orange-100 text-orange-800' },
  completed: { label: 'Hoàn thành', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-800' },
};

export default function SaleOrdersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const orders: Order[] = []; // TODO: Fetch from API

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý đơn hàng</h1>
          <p className="text-gray-500 mt-1">Theo dõi và quản lý đơn hàng kinh doanh</p>
        </div>
        <button className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors">
          <Plus className="w-4 h-4" />
          Tạo đơn hàng
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 bg-white rounded-xl shadow-sm border p-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm đơn hàng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="all">Tất cả trạng thái</option>
          {Object.entries(statusConfig).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left px-6 py-3 font-medium text-gray-500">Mã đơn</th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">Khách hàng</th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">Dịch vụ</th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">Tổng tiền</th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">Trạng thái</th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">Ngày tạo</th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-16">
                  <ShoppingCart className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-400">Chưa có đơn hàng nào</p>
                  <p className="text-gray-400 text-xs mt-1">Tạo đơn hàng đầu tiên để bắt đầu</p>
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-mono text-xs">{order.id}</td>
                  <td className="px-6 py-4">{order.customer}</td>
                  <td className="px-6 py-4">{order.service}</td>
                  <td className="px-6 py-4 font-medium">{order.amount}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[order.status].color}`}>
                      {statusConfig[order.status].label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{order.createdAt}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button className="p-1 hover:bg-gray-100 rounded"><Eye className="w-4 h-4 text-gray-500" /></button>
                      <button className="p-1 hover:bg-gray-100 rounded"><Edit className="w-4 h-4 text-gray-500" /></button>
                      <button className="p-1 hover:bg-gray-100 rounded"><MoreHorizontal className="w-4 h-4 text-gray-500" /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
