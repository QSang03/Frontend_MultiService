'use client';

import { useState } from 'react';
import { DollarSign, Users, AlertTriangle, FileText, Zap, TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import QuickQuoteModal from '@/components/QuickQuoteModal';

const stats = [
  { 
    label: 'Hoa hồng chờ', 
    value: '$1,250', 
    icon: DollarSign, 
    gradient: 'from-blue-500 to-indigo-600',
    bg: 'bg-blue-50',
    change: '+12%',
    sub: 'so tháng trước',
    positive: true
  },
  { 
    label: 'Lead đang theo dõi', 
    value: '45', 
    icon: Users, 
    gradient: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-50',
    change: '+5%',
    sub: 'mới tuần này',
    positive: true
  },
  { 
    label: 'Vi phạm SLA', 
    value: '2', 
    icon: AlertTriangle, 
    gradient: 'from-rose-500 to-red-600',
    bg: 'bg-rose-50',
    change: '-10%',
    sub: 'cần xử lý ngay',
    positive: false
  },
  { 
    label: 'Hợp đồng hiệu lực', 
    value: '18', 
    icon: FileText, 
    gradient: 'from-emerald-500 to-teal-600',
    bg: 'bg-emerald-50',
    change: '+2%',
    sub: 'gói dài hạn',
    positive: true
  },
];

const urgentTasks = [
  {
    id: '1',
    type: 'sla',
    title: 'SLA Warning: Corp ABC',
    description: 'Server maintenance ticket pending for 3.5h. 4h limit.',
    link: '#',
    icon: AlertTriangle,
    accent: 'border-l-rose-500',
    bg: 'bg-rose-50/60',
    iconColor: 'text-rose-500',
    linkColor: 'text-rose-600 hover:text-rose-700',
    action: 'Xem Ticket',
  },
  {
    id: '2',
    type: 'contract',
    title: 'Contract Renewal',
    description: 'TechSoft Inc. expires in 7 days.',
    link: '#',
    icon: FileText,
    accent: 'border-l-blue-500',
    bg: 'bg-blue-50/60',
    iconColor: 'text-blue-500',
    linkColor: 'text-blue-600 hover:text-blue-700',
    action: 'Tạo báo giá',
  },
  {
    id: '3',
    type: 'merge',
    title: 'Guest Merge Request',
    description: 'Phone +84 987... matches existing user.',
    link: '#',
    icon: Users,
    accent: 'border-l-violet-500',
    bg: 'bg-violet-50/60',
    iconColor: 'text-violet-500',
    linkColor: 'text-violet-600 hover:text-violet-700',
    action: 'Xử lý',
  },
];

// Mock data for the chart
const chartDataSets = {
  '7days': [
    { day: 'Mon', revenue: 3500, profit: 2800 },
    { day: 'Tue', revenue: 4200, profit: 3200 },
    { day: 'Wed', revenue: 10000, profit: 7500 },
    { day: 'Thu', revenue: 6500, profit: 4800 },
    { day: 'Fri', revenue: 5800, profit: 4400 },
    { day: 'Sat', revenue: 6200, profit: 4600 },
    { day: 'Sun', revenue: 5500, profit: 4200 },
  ],
  '30days': [
    { day: 'Week 1', revenue: 24500, profit: 18200 },
    { day: 'Week 2', revenue: 28900, profit: 21500 },
    { day: 'Week 3', revenue: 32100, profit: 24800 },
    { day: 'Week 4', revenue: 29800, profit: 22400 },
  ],
  '90days': [
    { day: 'Jan', revenue: 95000, profit: 71000 },
    { day: 'Feb', revenue: 102000, profit: 78500 },
    { day: 'Mar', revenue: 118000, profit: 89000 },
  ],
};

export default function SaleDashboardPage() {
  const [timeRange, setTimeRange] = useState<'7days' | '30days' | '90days'>('7days');
  const [showQuickQuote, setShowQuickQuote] = useState(false);

  const chartData = chartDataSets[timeRange];
  const maxValue = Math.max(...chartData.map(d => Math.max(d.revenue, d.profit)));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">
            <span className="bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">Dashboard</span>
          </h1>
          <p className="text-gray-400 mt-1 text-sm">Tổng quan hiệu suất bán hàng &amp; SLA.</p>
        </div>
        <button 
          onClick={() => setShowQuickQuote(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-blue-600 text-white px-4 py-2.5 rounded-xl hover:from-violet-700 hover:to-blue-700 transition-all shadow-md shadow-violet-200 font-medium text-sm"
        >
          <Zap className="w-4 h-4" />
          Quick Quote
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
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
              <p className="text-3xl font-black text-gray-900 leading-tight">{stat.value}</p>
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
              <h2 className="text-base font-bold text-gray-900">Doanh thu &amp; Lợi nhuần</h2>
              <p className="text-xs text-gray-400 mt-0.5">Biếu đồ xu hướng theo thời gian</p>
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
            {/* Y-axis labels */}
            <div className="absolute left-2 top-4 bottom-12 flex flex-col justify-between text-xs text-gray-400">
              <span>{Math.round(maxValue)}</span>
              <span>{Math.round(maxValue * 0.75)}</span>
              <span>{Math.round(maxValue * 0.5)}</span>
              <span>{Math.round(maxValue * 0.25)}</span>
              <span>0</span>
            </div>
            
            {/* Chart Area */}
            <div className="absolute left-14 right-4 top-4 bottom-12">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Grid lines */}
                {[0, 25, 50, 75, 100].map((y) => (
                  <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#f3f4f6" strokeWidth="0.5" />
                ))}
                
                {/* Gradients */}
                <defs>
                  <linearGradient id="blueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#60a5fa', stopOpacity: 0.7 }} />
                    <stop offset="100%" style={{ stopColor: '#93c5fd', stopOpacity: 0.1 }} />
                  </linearGradient>
                  <linearGradient id="greenGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#34d399', stopOpacity: 0.7 }} />
                    <stop offset="100%" style={{ stopColor: '#6ee7b7', stopOpacity: 0.1 }} />
                  </linearGradient>
                </defs>
                
                {/* Revenue area (blue) */}
                <path
                  d={(() => {
                    let path = 'M 0 100';
                    chartData.forEach((d, i) => {
                      const x = (i / (chartData.length - 1)) * 100;
                      const y = 100 - (d.revenue / maxValue) * 100;
                      if (i === 0) {
                        path += ` L 0 ${y}`;
                      }
                      path += ` L ${x} ${y}`;
                    });
                    path += ' L 100 100 Z';
                    return path;
                  })()}
                  fill="url(#blueGradient)"
                  stroke="#60a5fa"
                  strokeWidth="0.5"
                />
                
                {/* Profit area (green) */}
                <path
                  d={(() => {
                    let path = 'M 0 100';
                    chartData.forEach((d, i) => {
                      const x = (i / (chartData.length - 1)) * 100;
                      const y = 100 - (d.profit / maxValue) * 100;
                      if (i === 0) {
                        path += ` L 0 ${y}`;
                      }
                      path += ` L ${x} ${y}`;
                    });
                    path += ' L 100 100 Z';
                    return path;
                  })()}
                  fill="url(#greenGradient)"
                  stroke="#34d399"
                  strokeWidth="0.5"
                />
              </svg>
            </div>
            
            {/* X-axis labels */}
            <div className="absolute left-14 right-4 bottom-2 flex justify-between">
              {chartData.map((data, index) => (
                <span key={index} className="text-xs text-gray-500">{data.day}</span>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-50">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500"></div>
              <span className="text-xs text-gray-500 font-medium">Doanh thu</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500"></div>
              <span className="text-xs text-gray-500 font-medium">Lợi nhuần</span>
            </div>
          </div>
        </div>

        {/* Urgent Tasks */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900">Việc cần xử lý</h2>
            <span className="text-xs font-bold bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full">{urgentTasks.length}</span>
          </div>
          <div className="space-y-2.5">
            {urgentTasks.map((task) => {
              const Icon = task.icon;
              return (
                <div key={task.id} className={`${task.bg} border-l-4 ${task.accent} rounded-r-xl p-3.5`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-7 h-7 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-sm`}>
                      <Icon className={`w-3.5 h-3.5 ${task.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900">{task.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{task.description}</p>
                      <Link 
                        href={task.link} 
                        className={`inline-flex items-center gap-1 text-xs font-semibold mt-2 ${task.linkColor}`}
                      >
                        {task.action}
                        <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

      {/* Quick Quote Modal */}
      <QuickQuoteModal isOpen={showQuickQuote} onClose={() => setShowQuickQuote(false)} />
        </div>
      </div>

      {/* Additional sections can be added here */}
    </div>
  );
}
