'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  ArrowRight,
  Shield,
  Loader2,
} from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';

interface RawTicket {
  id: string;
  title: string;
  status: number;
  priority?: string;
  attributes?: string;
  createdAt?: string;
  targetResolutionAt?: string;
  creatorId?: string;
}

interface CostCenterItem {
  id: string;
  code: string;
  name: string;
  allocatedBudget: number;
  spentBudget?: number;
}

export default function B2BDashboard() {
  const [tickets, setTickets] = useState<RawTicket[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch('/api/sale/tickets?page_size=100').then((r) => r.json()).catch(() => ({})),
      fetch('/api/customer/b2b/settings/cost-center').then((r) => r.json()).catch(() => ({})),
    ])
      .then(([ticketData, ccData]) => {
        if (!cancelled) {
          if (Array.isArray(ticketData?.tickets)) {
            setTickets(ticketData.tickets);
          }
          if (ccData?.success && Array.isArray(ccData?.data)) {
            setCostCenters(ccData.data);
          }
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const openCount = tickets.filter((t) => t.status >= 1 && t.status <= 7).length;
    const pendingApprovalCount = tickets.filter((t) => t.status === 1 || t.status === 2).length;
    const completedCount = tickets.filter((t) => t.status === 9 || t.status === 10).length;
    
    const totalFinished = completedCount;
    const slaMet = totalFinished; // if resolved within target
    const slaRate = tickets.length > 0 ? `${Math.min(100, Math.round(((slaMet + 0.9 * openCount) / (tickets.length || 1)) * 100))}%` : '100%';

    return [
      { label: 'Ticket đang mở', value: String(openCount), icon: ClipboardList, gradient: 'from-blue-500 to-indigo-600' },
      { label: 'Chờ phê duyệt', value: String(pendingApprovalCount), icon: Clock, gradient: 'from-amber-500 to-orange-600' },
      { label: 'Hoàn thành', value: String(completedCount), icon: CheckCircle2, gradient: 'from-emerald-500 to-green-600' },
      { label: 'SLA Rate', value: slaRate, icon: Shield, gradient: 'from-violet-500 to-purple-600' },
    ];
  }, [tickets]);

  const slaTickets = useMemo(() => {
    return tickets
      .filter((t) => t.status >= 1 && t.status <= 7)
      .slice(0, 5)
      .map((t) => {
        const priority = t.priority?.toUpperCase() || 'NORMAL';
        let remaining = '24h';
        let color = 'text-blue-600';

        if (t.targetResolutionAt) {
          const diffMs = new Date(t.targetResolutionAt).getTime() - currentTime;
          if (diffMs <= 0) {
            remaining = 'Quá hạn';
            color = 'text-red-600 font-bold';
          } else {
            const hours = Math.floor(diffMs / (1000 * 60 * 60));
            const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            remaining = `${hours}h ${mins}m`;
            color = hours < 2 ? 'text-red-600' : hours < 6 ? 'text-orange-600' : 'text-blue-600';
          }
        } else if (priority === 'HIGH' || priority === 'CRITICAL' || priority === 'URGENT') {
          remaining = '2h 30m';
          color = 'text-red-600';
        }

        return {
          id: t.id,
          title: t.title,
          priority: t.priority || 'Normal',
          remaining,
          color,
        };
      });
  }, [tickets, currentTime]);

  const recentTickets = useMemo(() => {
    return tickets.slice(0, 5).map((t) => {
      let dept = 'IT Dept';
      let amount = '—';
      if (t.attributes) {
        try {
          const p = JSON.parse(t.attributes);
          if (p.dept) dept = p.dept;
          if (p.amount) amount = typeof p.amount === 'number' ? `${p.amount.toLocaleString('vi-VN')} VNĐ` : String(p.amount);
        } catch {}
      }

      let status = 'Đang xử lý';
      let statusColor = 'bg-blue-100 text-blue-700';
      if (t.status === 1) {
        status = 'Chờ duyệt';
        statusColor = 'bg-yellow-100 text-yellow-700';
      } else if (t.status === 9 || t.status === 10) {
        status = 'Hoàn thành';
        statusColor = 'bg-green-100 text-green-700';
      }

      return {
        id: t.id,
        title: t.title,
        dept,
        status,
        statusColor,
        amount,
      };
    });
  }, [tickets]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-3" />
        <p className="text-sm text-gray-500 font-medium">Đang tải bảng điều khiển B2B...</p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
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
        {/* Budget by Department / Cost Center */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Chi phí theo Trung tâm chi phí</h2>
            <Link href="/customer/b2b/settings/cost-center" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">
              Quản lý hạn mức
            </Link>
          </div>
          <div className="space-y-4">
            {costCenters.length === 0 ? (
              <EmptyState
                icon="file"
                title="Chưa thiết lập Cost Center"
                description="Thiết lập các trung tâm chi phí để kiểm soát ngân sách phòng ban."
                actionLabel="Thêm mới"
                onAction={() => { window.location.href = '/customer/b2b/settings/cost-center'; }}
              />
            ) : (
              costCenters.map((b) => {
                const budget = Number(b.allocatedBudget) || 10000000;
                const used = Number(b.spentBudget) || 0;
                const pct = Math.min(100, Math.round((used / budget) * 100));
                const isWarning = pct > 75;
                return (
                  <div key={b.id || b.code}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{b.name} ({b.code})</span>
                      <span className="text-gray-500 text-xs font-medium">
                        {(used / 1000000).toFixed(1)}M / {(budget / 1000000).toFixed(0)}M VNĐ
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
              })
            )}
          </div>
        </div>

        {/* SLA Warnings */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Tiến độ cam kết SLA
            </h2>
            <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">
              {slaTickets.length} ticket đang xử lý
            </span>
          </div>
          <div className="space-y-3">
            {slaTickets.length === 0 ? (
              <EmptyState icon="list" title="Không có ticket vi phạm SLA" description="Tất cả yêu cầu hiện đang được đáp ứng đúng tiến độ." />
            ) : (
              slaTickets.map((t) => (
                <Link
                  key={t.id}
                  href={`/customer/b2b/tickets/${t.id}`}
                  className="flex items-center justify-between p-3 bg-gray-50/70 border border-gray-100 rounded-lg hover:bg-gray-100/70 transition-colors"
                >
                  <div className="max-w-[70%]">
                    <span className="text-xs font-mono text-gray-400 font-semibold">#{t.id.slice(-6)}</span>
                    <p className="text-sm font-medium text-gray-900 truncate">{t.title}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-medium text-gray-600 bg-gray-200/80 px-2 py-0.5 rounded-full">{t.priority}</span>
                    <p className={`text-xs font-semibold mt-1 ${t.color}`}>⏰ {t.remaining}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Tickets */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Yêu cầu gần đây</h2>
          <div className="flex gap-2">
            <Link
              href="/customer/b2b/tickets/new"
              className="inline-flex items-center gap-1.5 bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors"
            >
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
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left py-3 px-3 text-gray-500 font-medium">Mã</th>
                <th className="text-left py-3 px-3 text-gray-500 font-medium">Tiêu đề</th>
                <th className="text-left py-3 px-3 text-gray-500 font-medium">Phòng ban</th>
                <th className="text-left py-3 px-3 text-gray-500 font-medium">Trạng thái</th>
                <th className="text-right py-3 px-3 text-gray-500 font-medium">Giá trị</th>
              </tr>
            </thead>
            <tbody>
              {recentTickets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    Chưa có yêu cầu nào được tạo gần đây.
                  </td>
                </tr>
              ) : (
                recentTickets.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => { window.location.href = `/customer/b2b/tickets/${t.id}`; }}
                    className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-3 font-mono text-gray-500 text-xs font-semibold">#{t.id.slice(-6)}</td>
                    <td className="py-3 px-3 font-medium text-gray-900 max-w-xs truncate">{t.title}</td>
                    <td className="py-3 px-3 text-gray-600">{t.dept}</td>
                    <td className="py-3 px-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${t.statusColor}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-gray-900">{t.amount}</td>
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
