'use client';

import React from 'react';
import { 
  BarChart as BarChartIcon, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  Star, 
  Zap, 
  Award, 
  Briefcase,
  ChevronDown,
  User
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

// --- Mock Data ---
const CHART_DATA = [
  { name: 'Week 1', income: 4500000 },
  { name: 'Week 2', income: 5200000 },
  { name: 'Week 3', income: 3800000 },
  { name: 'Week 4', income: 6100000 },
];

const COMMISSION_HISTORY = [
  {
    jobId: 'T-2025-004',
    service: 'CCTV Alignment',
    date: '20 Dec',
    coeff: '1.0',
    tags: [],
    commission: 350000
  },
  {
    jobId: 'T-2025-003',
    service: 'OS Upgrade',
    date: '19 Dec',
    coeff: '1.5',
    tags: ['Urgent'],
    commission: 850000
  },
  {
    jobId: 'T-2025-002',
    service: 'Network Config',
    date: '18 Dec',
    coeff: '1.0',
    tags: [],
    commission: 420000
  },
  {
    jobId: 'T-2025-001',
    service: 'Server Maintenance',
    date: '15 Dec',
    coeff: '2.0',
    tags: ['Weekend'],
    commission: 1200000
  },
];

const ACHIEVEMENTS = [
  {
    id: 1,
    title: 'Speed Demon',
    desc: 'Closed 5 tickets under 2h SLA',
    icon: Zap,
    color: 'text-amber-500',
    bg: 'bg-amber-50'
  },
  {
    id: 2,
    title: '5-Star Streak',
    desc: 'Maintained 5.0 rating for 7 days',
    icon: Star,
    color: 'text-blue-500',
    bg: 'bg-blue-50'
  },
  {
    id: 3,
    title: 'Tech Wizard',
    desc: 'Solved 10 hardware issues',
    icon: Briefcase,
    color: 'text-purple-500',
    bg: 'bg-purple-50'
  }
];

const FEEDBACKS = [
  {
    id: 1,
    client: 'TECHCORP ENTERPRISES',
    rating: 5,
    comment: 'Technician was extremely professional and resolved the server issue quickly.',
    date: '2 days ago'
  },
  {
    id: 2,
    client: 'DESIGN STUDIO X',
    rating: 4,
    comment: 'Good job fixing the workstation, but arrived 15 mins late.',
    date: '5 days ago'
  },
  {
    id: 3,
    client: 'LAWSON LOGISTICS',
    rating: 5,
    comment: 'Explained the network configuration clearly. Very helpful!',
    date: '1 week ago'
  }
];

export default function PerformanceDashboard() {
  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Performance Dashboard</h1>
            <p className="text-gray-500 mt-1">Track your earnings, efficiency, and customer satisfaction</p>
          </div>
          
          <div className="flex items-center bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
            <button className="px-4 py-2 text-sm font-bold text-gray-900 bg-gray-50 rounded-lg shadow-sm">Dec 2025</button>
            <button className="px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 rounded-lg transition-colors">Nov 2025</button>
            <button className="px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 rounded-lg transition-colors">Oct 2025</button>
          </div>
        </div>

        {/* TOP STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          {/* Est. Income */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-2xl shadow-lg shadow-blue-900/20 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <span className="text-9xl font-serif">
                $
              </span>
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2 opacity-90">
                <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                  <span className="text-xs font-bold">$</span>
                </div>
                <span className="text-xs font-bold uppercase tracking-wider">Est. Income</span>
              </div>
              <h2 className="text-3xl font-bold mb-2">19.6M <span className="text-lg font-medium opacity-80">VND</span></h2>
              <div className="flex items-center gap-1 text-xs font-medium bg-white/20 self-start inline-flex px-2 py-1 rounded">
                <TrendingUp className="w-3 h-3" />
                <span>+12% from last month</span>
              </div>
            </div>
          </div>

          {/* Jobs Done */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4 text-gray-500">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-xs font-bold uppercase tracking-wider">Jobs Done</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-1">42</h2>
              <p className="text-xs text-gray-500">Target: 50 jobs</p>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mt-4">
               <div className="h-full bg-green-500 w-[84%] rounded-full"></div>
            </div>
          </div>

          {/* SLA Compliance */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4 text-gray-500">
                <Clock className="w-4 h-4 text-orange-500" />
                <span className="text-xs font-bold uppercase tracking-wider">SLA Compliance</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-1">96.5%</h2>
              <p className="text-xs text-gray-500">Excellent performance</p>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mt-4">
               <div className="h-full bg-orange-500 w-[96%] rounded-full"></div>
            </div>
          </div>

          {/* Avg Rating */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4 text-gray-500">
                <Star className="w-4 h-4 text-yellow-500" />
                <span className="text-xs font-bold uppercase tracking-wider">Avg Rating</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                4.8 <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              </h2>
              <p className="text-xs text-gray-500">Based on 38 reviews</p>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mt-4">
               <div className="h-full bg-yellow-400 w-[96%] rounded-full"></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN (2/3) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Income Analysis Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2 text-blue-600">
                   <div className="p-1.5 bg-blue-50 rounded-lg">
                      <BarChartIcon className="w-4 h-4" />
                   </div>
                   <h3 className="font-bold text-gray-900 text-sm">Income Analysis</h3>
                </div>
                
                <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100">
                  Weekly View
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>
              
              <div className="h-[300px] w-full min-w-0">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={CHART_DATA} barSize={40}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#94a3b8', fontSize: 12}} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#94a3b8', fontSize: 12}} 
                      tickFormatter={(value) => `${value / 1000000}M`}
                    />
                    <Tooltip 
                      cursor={{fill: '#f8fafc'}}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value?: number) => value ? [`${value.toLocaleString()} VND`, 'Income'] : ['', 'Income']}
                    />
                    <Bar 
                      dataKey="income" 
                      fill="#3b82f6" 
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Commission History Table */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-900 text-sm">Commission History</h3>
                <button className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline">View Full Report</button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider pb-3 pl-2">Job ID</th>
                      <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider pb-3">Service Type</th>
                      <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider pb-3">Date</th>
                      <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider pb-3">Tech Coeff (K)</th>
                      <th className="text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider pb-3 pr-2">Commission</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {COMMISSION_HISTORY.map((item, index) => (
                      <tr key={index} className="group hover:bg-gray-50/50 transition-colors">
                        <td className="py-4 pl-2 text-sm font-bold text-gray-900">{item.jobId}</td>
                        <td className="py-4 text-sm text-gray-600">{item.service}</td>
                        <td className="py-4 text-sm text-gray-500">{item.date}</td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-bold">
                              {item.coeff}
                            </span>
                            {item.tags.map(tag => (
                              <span key={tag} className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-4 pr-2 text-right text-sm font-bold text-green-600">
                          +{item.commission.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN (1/3) */}
          <div className="lg:col-span-1 space-y-8">
            
            {/* Achievements */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-6">
                <Award className="w-5 h-5 text-yellow-500" />
                <h3 className="font-bold text-gray-900">Achievements</h3>
              </div>
              
              <div className="space-y-4">
                {ACHIEVEMENTS.map(ach => (
                  <div key={ach.id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-50 hover:border-gray-100 hover:shadow-sm transition-all bg-white">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${ach.bg} ${ach.color}`}>
                      <ach.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{ach.title}</h4>
                      <p className="text-xs text-gray-500">{ach.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Client Feedback */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-1 bg-blue-50 rounded">
                   <User className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="font-bold text-gray-900">Client Feedback</h3>
              </div>
              
              <div className="space-y-6">
                {FEEDBACKS.map(fb => (
                  <div key={fb.id} className="border-b border-gray-50 last:border-0 pb-6 last:pb-0">
                    <div className="flex justify-between items-start mb-2">
                       <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide">{fb.client}</h4>
                       <span className="text-[10px] text-gray-400">{fb.date}</span>
                    </div>
                    <div className="flex mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-3 h-3 ${i < fb.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} 
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 italic leading-relaxed">&ldquo;{fb.comment}&rdquo;</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-50">
                <button className="w-full py-2 text-xs font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors border border-dashed border-gray-200">
                  View All Reviews
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
