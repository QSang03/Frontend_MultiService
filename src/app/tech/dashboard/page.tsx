'use client';

import React, { useState, useEffect } from 'react';
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
  User,
  Loader2
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

interface ChartPoint {
  name: string;
  income: number;
}

interface CommissionItem {
  jobId: string;
  service: string;
  date: string;
  coeff: string;
  tags: string[];
  commission: number;
}

const ACHIEVEMENTS = [
  {
    id: 1,
    title: 'Xử lý thần tốc',
    desc: 'Hoàn thành nhiều ticket đạt chuẩn SLA',
    icon: Zap,
    color: 'text-amber-500',
    bg: 'bg-amber-50'
  },
  {
    id: 2,
    title: 'Kỹ thuật viên 5 sao',
    desc: 'Duy trì đánh giá chất lượng xuất sắc',
    icon: Star,
    color: 'text-blue-500',
    bg: 'bg-blue-50'
  },
  {
    id: 3,
    title: 'Chuyên gia phần cứng',
    desc: 'Khắc phục triệt để sự cố phức tạp',
    icon: Briefcase,
    color: 'text-purple-500',
    bg: 'bg-purple-50'
  }
];

export default function PerformanceDashboard() {
  const [stats, setStats] = useState({
    incomeMonth: 0,
    incomeFormatted: '0 đ',
    completedTickets: 0,
    totalTickets: 0,
    slaRate: '100%',
    rating: '5.0',
  });
  const [chartData, setChartData] = useState<ChartPoint[]>([
    { name: 'Tuần 1', income: 0 },
    { name: 'Tuần 2', income: 0 },
    { name: 'Tuần 3', income: 0 },
    { name: 'Tuần 4', income: 0 },
  ]);
  const [commissionHistory, setCommissionHistory] = useState<CommissionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/tech/dashboard/stats');
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            setStats({
              incomeMonth: json.data.incomeMonth || 0,
              incomeFormatted: json.data.incomeFormatted || '0 đ',
              completedTickets: json.data.completedTickets || 0,
              totalTickets: json.data.totalTickets || 0,
              slaRate: json.data.slaRate || '100%',
              rating: json.data.rating || '5.0',
            });
            if (Array.isArray(json.data.chartData)) {
              setChartData(json.data.chartData);
            }
            if (Array.isArray(json.data.commissionHistory)) {
              setCommissionHistory(json.data.commissionHistory);
            }
          }
        }
      } catch (err) {
        console.error('[tech/dashboard] Error loading dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bảng Hiệu Suất Kỹ Thuật Viên</h1>
            <p className="text-gray-500 mt-1">Theo dõi thu nhập thực tế, tiến độ hoàn thành ticket và chỉ số SLA</p>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">Cập nhật theo dữ liệu công việc thực tế</span>
          </div>
        </div>

        {/* METRICS OVERVIEW */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          {/* Monthly Income */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between relative overflow-hidden">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ước tính thu nhập</span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">{stats.incomeFormatted}</h2>
              <p className="text-xs text-gray-500">Tháng này theo KPI nghiệm thu</p>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mt-4">
               <div className="h-full bg-blue-500 w-[78%] rounded-full"></div>
            </div>
          </div>

          {/* Completed Jobs */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Công việc hoàn thành</span>
                <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-1">{stats.completedTickets}</h2>
              <p className="text-xs text-gray-500">Trên tổng số {stats.totalTickets} ticket được giao</p>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mt-4">
               <div 
                 className="h-full bg-green-500 rounded-full transition-all duration-500"
                 style={{ width: `${Math.min(100, (stats.completedTickets / Math.max(stats.totalTickets, 1)) * 100)}%` }}
               />
            </div>
          </div>

          {/* SLA Compliance */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tỷ lệ đạt SLA</span>
                <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-1">{stats.slaRate}</h2>
              <p className="text-xs text-gray-500">Đạt cam kết thời gian xử lý</p>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mt-4">
               <div className="h-full bg-orange-500 w-[95%] rounded-full"></div>
            </div>
          </div>

          {/* Avg Rating */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Điểm hài lòng</span>
                <div className="w-8 h-8 rounded-lg bg-yellow-50 text-yellow-600 flex items-center justify-center">
                  <Star className="w-4 h-4" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                {stats.rating} <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              </h2>
              <p className="text-xs text-gray-500">Đánh giá từ khách hàng</p>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mt-4">
               <div className="h-full bg-yellow-400 w-[98%] rounded-full"></div>
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
                   <h3 className="font-bold text-gray-900 text-sm">Phân Bổ Thu Nhập Theo Tuần</h3>
                </div>
                
                <span className="text-xs text-gray-400 font-medium">Theo tuần trong tháng</span>
              </div>
              
              <div className="h-[300px] w-full min-w-0">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData} barSize={40}>
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
                      formatter={(value?: number) => value ? [`${value.toLocaleString()} ₫`, 'Thu nhập'] : ['', 'Thu nhập']}
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
                <h3 className="font-bold text-gray-900 text-sm">Lịch Sử Công Việc & Hoa Hồng Gần Đây</h3>
                <span className="text-xs text-gray-500 font-medium">{commissionHistory.length} nhiệm vụ gần nhất</span>
              </div>

              {commissionHistory.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">
                  Chưa có nhiệm vụ kỹ thuật nào hoàn thành trong kỳ này.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider pb-3 pl-2">Mã Ticket</th>
                        <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider pb-3">Nội dung công việc</th>
                        <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider pb-3">Thời gian</th>
                        <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider pb-3">Hệ số K</th>
                        <th className="text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider pb-3 pr-2">Hoa hồng</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {commissionHistory.map((item, index) => (
                        <tr key={index} className="group hover:bg-gray-50/50 transition-colors">
                          <td className="py-4 pl-2 text-sm font-bold text-gray-900 font-mono">{item.jobId}</td>
                          <td className="py-4 text-sm text-gray-700 font-medium">{item.service}</td>
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
                            +{item.commission.toLocaleString()} ₫
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>

          {/* RIGHT COLUMN (1/3) */}
          <div className="lg:col-span-1 space-y-8">
            
            {/* Achievements */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-6">
                <Award className="w-5 h-5 text-yellow-500" />
                <h3 className="font-bold text-gray-900">Danh Hiệu Đạt Được</h3>
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
                <h3 className="font-bold text-gray-900">Phản Hồi Từ Khách Hàng</h3>
              </div>
              
              <div className="space-y-4">
                <div className="border-b border-gray-50 last:border-0 pb-4">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-xs text-gray-900">DOANH NGHIỆP DỊCH VỤ VẬN TẢI</span>
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 italic leading-relaxed">
                    Kỹ thuật viên hỗ trợ rất nhiệt tình, xử lý dứt điểm sự cố mạng và bàn giao đúng hẹn.
                  </p>
                </div>
                <div className="border-b border-gray-50 last:border-0 pb-4">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-xs text-gray-900">CÔNG TY PHẦN MỀM ALPHA</span>
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 italic leading-relaxed">
                    Khắc phục sự cố máy chủ nhanh chóng, có hướng dẫn chi tiết cách phòng tránh lỗi tương tự.
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
