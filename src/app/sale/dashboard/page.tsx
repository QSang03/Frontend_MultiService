'use client';

import { useState } from 'react';
import { DollarSign, Users, AlertTriangle, FileText, Zap } from 'lucide-react';
import Link from 'next/link';
import QuickQuoteModal from '@/components/QuickQuoteModal';

const stats = [
  { 
    label: 'Pending Commission', 
    value: '$1,250', 
    icon: DollarSign, 
    color: 'bg-blue-500',
    change: '+12% vs last month',
    positive: true
  },
  { 
    label: 'Active Leads', 
    value: '45', 
    icon: Users, 
    color: 'bg-blue-500',
    change: '+5% New this week',
    positive: true
  },
  { 
    label: 'SLA Breaches', 
    value: '2', 
    icon: AlertTriangle, 
    color: 'bg-red-500',
    change: '-10% Needs attention',
    positive: false
  },
  { 
    label: 'Active Contracts', 
    value: '18', 
    icon: FileText, 
    color: 'bg-green-500',
    change: '+2% Long-term deals',
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
    color: 'border-red-200 bg-red-50'
  },
  {
    id: '2',
    type: 'contract',
    title: 'Contract Renewal',
    description: 'TechSoft Inc. expires in 7 days.',
    link: '#',
    icon: FileText,
    color: 'border-blue-200 bg-blue-50'
  },
  {
    id: '3',
    type: 'merge',
    title: 'Guest Merge Request',
    description: 'Phone +84 987... matches existing user.',
    link: '#',
    icon: Users,
    color: 'border-gray-200 bg-gray-50'
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
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Overview of your sales performance and SLAs.</p>
        </div>
        <button 
          onClick={() => setShowQuickQuote(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Zap className="w-4 h-4" />
          New Quick Quote
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  <p className={`text-xs mt-2 ${stat.positive ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change}
                  </p>
                </div>
                <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center shrink-0`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart and Urgent Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Profit vs Revenue Trend</h2>
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as '7days' | '30days' | '90days')}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
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
          <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-400"></div>
              <span className="text-sm text-gray-600">Revenue</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
              <span className="text-sm text-gray-600">Profit</span>
            </div>
          </div>
        </div>

        {/* Urgent Tasks */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Urgent Tasks</h2>
          <div className="space-y-3">
            {urgentTasks.map((task) => {
              const Icon = task.icon;
              return (
                <div key={task.id} className={`border rounded-lg p-4 ${task.color}`}>
                  <div className="flex items-start gap-3">
                    <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${
                      task.type === 'sla' ? 'text-red-600' : 
                      task.type === 'contract' ? 'text-blue-600' : 
                      'text-gray-600'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-sm font-semibold ${
                        task.type === 'sla' ? 'text-red-900' : 
                        task.type === 'contract' ? 'text-blue-900' : 
                        'text-gray-900'
                      }`}>
                        {task.title}
                      </h3>
                      <p className="text-xs text-gray-600 mt-1">{task.description}</p>
                      <Link 
                        href={task.link} 
                        className={`inline-flex items-center text-xs font-medium mt-2 ${
                          task.type === 'sla' ? 'text-red-700 hover:text-red-800' : 
                          task.type === 'contract' ? 'text-blue-700 hover:text-blue-800' : 
                          'text-gray-700 hover:text-gray-800'
                        }`}
                      >
                        {task.type === 'sla' ? 'View Ticket' : 
                         task.type === 'contract' ? 'Prepare Quote' : 
                         'Resolve'} →
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
