'use client';

import { useState } from 'react';
import { ShoppingCart, Search, Plus, Eye, Edit, MoreHorizontal } from 'lucide-react';

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
