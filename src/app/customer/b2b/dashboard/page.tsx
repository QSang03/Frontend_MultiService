'use client';

import Link from 'next/link';
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  ArrowRight,
  Shield,
} from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';

const stats = [
  { label: 'Ticket đang mở', value: '15', icon: ClipboardList, gradient: 'from-blue-500 to-indigo-600', bg: 'bg-blue-50' },
  { label: 'Chờ phê duyệt', value: '3', icon: Clock, gradient: 'from-amber-500 to-orange-600', bg: 'bg-amber-50' },
  { label: 'Hoàn thành', value: '24', icon: CheckCircle2, gradient: 'from-emerald-500 to-green-600', bg: 'bg-emerald-50' },
  { label: 'SLA Rate', value: '85.6%', icon: Shield, gradient: 'from-violet-500 to-purple-600', bg: 'bg-violet-50' },
];

const budgets = [
  { dept: 'IT', budget: 30000000, used: 12500000 },
  { dept: 'Marketing', budget: 20000000, used: 6200000 },
  { dept: 'HR', budget: 10000000, used: 2800000 },
  { dept: 'Sales', budget: 25000000, used: 18000000 },
];

const slaTickets = [
  { id: 'T-0048', title: 'Sửa server NAS', priority: 'High', remaining: '1h 20m', color: 'text-red-600' },
  { id: 'T-0051', title: 'Cài ERP cho phòng kế toán', priority: 'Medium', remaining: '3h 45m', color: 'text-orange-600' },
  { id: 'T-0053', title: 'Sửa mạng WiFi tầng 5', priority: 'High', remaining: '2h 10m', color: 'text-red-600' },
];

const recentTickets = [
  { id: 'T-0055', title: 'Nâng cấp RAM 5 máy', dept: 'IT', status: 'Chờ Admin duyệt', statusColor: 'bg-yellow-100 text-yellow-700', amount: '5,000,000 VNĐ' },
  { id: 'T-0054', title: 'Mua license Microsoft 365', dept: 'HR', status: 'Đang xử lý', statusColor: 'bg-blue-100 text-blue-700', amount: '3,200,000 VNĐ' },
  { id: 'T-0052', title: 'Bảo trì máy in Phòng IT', dept: 'IT', status: 'Hoàn thành', statusColor: 'bg-green-100 text-green-700', amount: '800,000 VNĐ' },
];

export default function B2BDashboard() {
  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Budget by Department */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Chi phí theo Phòng ban</h2>
            <span className="text-xs text-gray-500">Tháng 3/2026</span>
          </div>
          <div className="space-y-4">
            {budgets.map((b) => {
              const pct = Math.round((b.used / b.budget) * 100);
              const isWarning = pct > 70;
              return (
                <div key={b.dept}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{b.dept}</span>
                    <span className="text-gray-500">
                      {(b.used / 1000000).toFixed(1)}M / {(b.budget / 1000000).toFixed(0)}M VNĐ
                      {isWarning && <AlertTriangle className="w-3.5 h-3.5 text-amber-500 inline ml-1" />}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${isWarning ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SLA Warnings */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Ticket sắp vi phạm SLA
            </h2>
            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
              {slaTickets.length}
            </span>
          </div>
          <div className="space-y-3">
            {slaTickets.length === 0 ? (
              <EmptyState icon="list" title="Không có ticket vi phạm SLA" description="Tất cả ticket đang trong thời hạn SLA." />
            ) : slaTickets.map((t) => (
              <Link
                key={t.id}
                href={`/customer/b2b/tickets/${t.id}`}
                className="flex items-center justify-between p-3 bg-red-50/50 border border-red-100 rounded-lg hover:bg-red-50 transition-colors"
              >
                <div>
                  <span className="text-sm font-mono text-gray-500">#{t.id}</span>
                  <p className="text-sm font-medium text-gray-900">{t.title}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded-full">{t.priority}</span>
                  <p className={`text-sm font-bold mt-1 ${t.color}`}>⏰ {t.remaining}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Tickets */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Yêu cầu gần đây</h2>
          <div className="flex gap-2">
            <Link href="/customer/b2b/tickets/new" className="inline-flex items-center gap-1.5 bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors">
              <Plus className="w-4 h-4" /> Tạo mới
            </Link>
            <Link href="/customer/b2b/tickets" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
              Xem tất cả <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 text-gray-500 font-medium">Mã</th>
                <th className="text-left py-3 text-gray-500 font-medium">Tiêu đề</th>
                <th className="text-left py-3 text-gray-500 font-medium">Phòng ban</th>
                <th className="text-left py-3 text-gray-500 font-medium">Trạng thái</th>
                <th className="text-right py-3 text-gray-500 font-medium">Giá trị</th>
              </tr>
            </thead>
            <tbody>
              {recentTickets.map((t) => (
                <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer">
                  <td className="py-3 font-mono text-gray-500">#{t.id}</td>
                  <td className="py-3 font-medium text-gray-900">{t.title}</td>
                  <td className="py-3 text-gray-600">{t.dept}</td>
                  <td className="py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${t.statusColor}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="py-3 text-right font-medium text-gray-900">{t.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
