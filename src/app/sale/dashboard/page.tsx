'use client';

import { useState, useEffect } from 'react';
import { DollarSign, Users, AlertTriangle, FileText, Zap, TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import QuickQuoteModal from '@/components/QuickQuoteModal';

const initialStats = [
  { 
    label: 'Hoa hồng chờ', 
    value: '0 ₫', 
    icon: DollarSign, 
    gradient: 'from-blue-500 to-indigo-600',
    bg: 'bg-blue-50',
    change: '+12%',
    sub: 'theo hợp đồng nghiệm thu',
    positive: true
  },
  { 
    label: 'Lead đang theo dõi', 
    value: '0', 
    icon: Users, 
    gradient: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-50',
    change: '+5%',
    sub: 'ticket & khách hàng mới',
    positive: true
  },
  { 
    label: 'Vi phạm SLA', 
    value: '0', 
    icon: AlertTriangle, 
    gradient: 'from-rose-500 to-red-600',
    bg: 'bg-rose-50',
    change: '0',
    sub: 'tuân thủ tiến độ',
    positive: true
  },
  { 
    label: 'Hợp đồng hiệu lực', 
    value: '0', 
    icon: FileText, 
    gradient: 'from-emerald-500 to-teal-600',
    bg: 'bg-emerald-50',
    change: '+2%',
    sub: 'gói dịch vụ đang chạy',
    positive: true
  },
];

interface UrgentTaskItem {
  id: string;
  type: string;
  title: string;
  description: string;
  link: string;
  action: string;
}

const defaultChartDataSets = {
  '7days': [
    { day: 'T2', revenue: 0, profit: 0 },
    { day: 'T3', revenue: 0, profit: 0 },
    { day: 'T4', revenue: 0, profit: 0 },
    { day: 'T5', revenue: 0, profit: 0 },
    { day: 'T6', revenue: 0, profit: 0 },
    { day: 'T7', revenue: 0, profit: 0 },
    { day: 'CN', revenue: 0, profit: 0 },
  ],
  '30days': [
    { day: 'Tuần 1', revenue: 0, profit: 0 },
    { day: 'Tuần 2', revenue: 0, profit: 0 },
    { day: 'Tuần 3', revenue: 0, profit: 0 },
    { day: 'Tuần 4', revenue: 0, profit: 0 },
  ],
  '90days': [
    { day: 'Tháng trước', revenue: 0, profit: 0 },
    { day: 'Tháng này', revenue: 0, profit: 0 },
    { day: 'Dự kiến tới', revenue: 0, profit: 0 },
  ],
};

export default function SaleDashboardPage() {
  const [timeRange, setTimeRange] = useState<'7days' | '30days' | '90days'>('7days');
  const [showQuickQuote, setShowQuickQuote] = useState(false);
  const [dashboardStats, setDashboardStats] = useState(initialStats);
  const [urgentTasks, setUrgentTasks] = useState<UrgentTaskItem[]>([]);
  const [chartDataSets, setChartDataSets] = useState(defaultChartDataSets);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/sale/dashboard/stats');
        if (res.ok) {
          const json = await res.json();
          const d = json.data;
          if (d) {
            setDashboardStats([
              {
                label: 'Hoa hồng chờ',
                value: d.pendingCommission || '0 ₫',
                icon: DollarSign,
                gradient: 'from-blue-500 to-indigo-600',
                bg: 'bg-blue-50',
                change: '+12%',
                sub: 'theo hợp đồng nghiệm thu',
                positive: true,
              },
              {
                label: 'Lead đang theo dõi',
                value: String(d.activeLeadsCount || 0),
                icon: Users,
                gradient: 'from-violet-500 to-purple-600',
                bg: 'bg-violet-50',
                change: '+5%',
                sub: 'ticket & khách hàng',
                positive: true,
              },
              {
                label: 'Vi phạm SLA',
                value: String(d.slaBreachesCount ?? 0),
                icon: AlertTriangle,
                gradient: 'from-rose-500 to-red-600',
                bg: 'bg-rose-50',
                change: d.slaBreachesCount > 0 ? '+1' : '0',
                sub: d.slaBreachesCount > 0 ? 'cần xử lý ngay' : 'tuân thủ 100%',
                positive: d.slaBreachesCount === 0,
              },
              {
                label: 'Hợp đồng hiệu lực',
                value: String(d.activeContractsCount || 0),
                icon: FileText,
                gradient: 'from-emerald-500 to-teal-600',
                bg: 'bg-emerald-50',
                change: '+2%',
                sub: 'gói dịch vụ đang chạy',
                positive: true,
              },
            ]);

            if (Array.isArray(d.urgentTasks)) {
              setUrgentTasks(d.urgentTasks);
            }
            if (d.chartDataSets) {
              setChartDataSets(d.chartDataSets);
            }
          }
        }
      } catch (err) {
        console.error('[sale/dashboard] Error loading stats:', err);
      }
    }
    loadStats();
  }, []);

  const chartData = chartDataSets[timeRange] || defaultChartDataSets[timeRange];
  const maxValue = Math.max(1, ...chartData.map(d => Math.max(d.revenue, d.profit)));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">
            <span className="bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">Bảng Điều Khiển Kinh Doanh</span>
          </h1>
          <p className="text-gray-400 mt-1 text-sm">Tổng quan hiệu suất bán hàng, báo giá và tiến độ SLA thực tế.</p>
        </div>
        <button 
          onClick={() => setShowQuickQuote(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-blue-600 text-white px-4 py-2.5 rounded-xl hover:from-violet-700 hover:to-blue-700 transition-all shadow-md shadow-violet-200 font-medium text-sm"
        >
          <Zap className="w-4 h-4" />
          Báo giá nhanh (Quick Quote)
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {dashboardStats.map((stat) => {
          const Icon = stat.icon;
          const TrendIcon = stat.positive ? TrendingUp : TrendingDown;
          return (
            <div key={stat.label} className={`${stat.bg} rounded-2xl p-5 border border-white/60 shadow-sm hover:shadow-md transition-shadow`}>
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-sm`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                  stat.positive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                }`}>
                  <TrendIcon className="w-3 h-3" />
                  {stat.change}
                </span>
              </div>
              <p className="text-2xl lg:text-3xl font-black text-gray-900 leading-tight">{stat.value}</p>
              <p className="text-sm font-semibold text-gray-700 mt-0.5">{stat.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Chart and Urgent Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-gray-900">Doanh thu &amp; Lợi nhuận</h2>
              <p className="text-xs text-gray-400 mt-0.5">Biểu đồ ước tính theo hợp đồng và báo giá</p>
            </div>
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as '7days' | '30days' | '90days')}
              className="text-xs border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50 font-medium"
            >
              <option value="7days">7 ngày qua</option>
              <option value="30days">30 ngày qua</option>
              <option value="90days">90 ngày qua</option>
            </select>
          </div>
          
          {/* Area Chart */}
          <div className="relative h-64 bg-white rounded-lg p-4">
            <div className="absolute left-0 top-4 bottom-8 flex flex-col justify-between text-xs text-gray-400 font-mono">
              <span>{(maxValue / 1000000).toFixed(0)}M</span>
              <span>{(maxValue * 0.75 / 1000000).toFixed(0)}M</span>
              <span>{(maxValue * 0.5 / 1000000).toFixed(0)}M</span>
              <span>{(maxValue * 0.25 / 1000000).toFixed(0)}M</span>
              <span>0</span>
            </div>
            
            <div className="absolute left-14 right-4 top-4 bottom-8">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="blueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="greenGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                
                <path
                  d={(() => {
                    let path = 'M 0 100';
                    chartData.forEach((d, i) => {
                      const x = (i / Math.max(1, chartData.length - 1)) * 100;
                      const y = 100 - (d.revenue / maxValue) * 100;
                      if (i === 0) path += ` L 0 ${y}`;
                      path += ` L ${x} ${y}`;
                    });
                    path += ' L 100 100 Z';
                    return path;
                  })()}
                  fill="url(#blueGradient)"
                  stroke="#60a5fa"
                  strokeWidth="0.8"
                />
                
                <path
                  d={(() => {
                    let path = 'M 0 100';
                    chartData.forEach((d, i) => {
                      const x = (i / Math.max(1, chartData.length - 1)) * 100;
                      const y = 100 - (d.profit / maxValue) * 100;
                      if (i === 0) path += ` L 0 ${y}`;
                      path += ` L ${x} ${y}`;
                    });
                    path += ' L 100 100 Z';
                    return path;
                  })()}
                  fill="url(#greenGradient)"
                  stroke="#34d399"
                  strokeWidth="0.8"
                />
              </svg>
            </div>
            
            <div className="absolute left-14 right-4 bottom-2 flex justify-between">
              {chartData.map((data, index) => (
                <span key={index} className="text-xs text-gray-500">{data.day}</span>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-50">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500"></div>
              <span className="text-xs text-gray-500 font-medium">Doanh thu</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500"></div>
              <span className="text-xs text-gray-500 font-medium">Lợi nhuận ước tính</span>
            </div>
          </div>
        </div>

        {/* Urgent Tasks */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900">Việc cần xử lý ngay</h2>
            <span className="text-xs font-bold bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full">{urgentTasks.length}</span>
          </div>
          <div className="space-y-2.5">
            {urgentTasks.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">Không có việc khẩn cấp nào cần xử lý.</p>
            ) : (
              urgentTasks.map((task) => {
                const isSla = task.type === 'sla';
                return (
                  <div key={task.id} className={`${isSla ? 'bg-rose-50/60 border-l-rose-500' : 'bg-blue-50/60 border-l-blue-500'} border-l-4 rounded-r-xl p-3.5`}>
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-sm">
                        {isSla ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                        ) : (
                          <FileText className="w-3.5 h-3.5 text-blue-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900">{task.title}</h3>
                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{task.description}</p>
                        <Link 
                          href={task.link} 
                          className={`inline-flex items-center gap-1 text-xs font-semibold mt-2 ${isSla ? 'text-rose-600 hover:text-rose-700' : 'text-blue-600 hover:text-blue-700'}`}
                        >
                          {task.action}
                          <ArrowUpRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Quick Quote Modal */}
      <QuickQuoteModal 
        isOpen={showQuickQuote} 
        onClose={() => setShowQuickQuote(false)} 
      />
    </div>
  );
}
