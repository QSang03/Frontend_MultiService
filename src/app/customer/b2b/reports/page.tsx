'use client';

import { useState } from 'react';
import { Download, BarChart3, TrendingUp, TrendingDown } from 'lucide-react';

const deptReportData = [
  { dept: 'IT', budget: 30000000, used: 12500000, prevUsed: 11875000 },
  { dept: 'Marketing', budget: 20000000, used: 6200000, prevUsed: 6324000 },
  { dept: 'Sales', budget: 25000000, used: 18000000, prevUsed: 15254000 },
  { dept: 'HR', budget: 10000000, used: 2800000, prevUsed: 2772000 },
];

export default function ReportsB2B() {
  const [activeTab, setActiveTab] = useState('dept');
  const tabs = [
    { key: 'dept', label: 'Chi phí Phòng ban' },
    { key: 'project', label: 'Chi phí Dự án' },
    { key: 'tco', label: 'Tài sản (TCO)' },
    { key: 'sla', label: 'SLA' },
  ];

  const totalBudget = deptReportData.reduce((s, d) => s + d.budget, 0);
  const totalUsed = deptReportData.reduce((s, d) => s + d.used, 0);

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Báo cáo & Thống kê</h1>
        <div className="flex gap-2">
          <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none">
            <option>Tháng 3/2026</option>
            <option>Tháng 2/2026</option>
            <option>Tháng 1/2026</option>
          </select>
          <button className="inline-flex items-center gap-1.5 border border-gray-200 px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" /> Xuất Excel
          </button>
          <button className="inline-flex items-center gap-1.5 border border-gray-200 px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" /> Xuất PDF
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto">
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${activeTab === tab.key ? 'bg-white text-[#0f172a] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dept Report */}
      {activeTab === 'dept' && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500">Tổng ngân sách</p>
              <p className="text-2xl font-bold text-gray-900">{(totalBudget / 1000000).toFixed(0)}M VNĐ</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500">Tổng đã dùng</p>
              <p className="text-2xl font-bold text-blue-600">{(totalUsed / 1000000).toFixed(1)}M VNĐ</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500">Tỷ lệ sử dụng</p>
              <p className="text-2xl font-bold text-emerald-600">{Math.round((totalUsed / totalBudget) * 100)}%</p>
            </div>
          </div>

          {/* Visual Bar Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Phân bổ chi phí theo phòng ban</h3>
            <div className="space-y-4">
              {deptReportData.map((d) => {
                const pct = Math.round((d.used / d.budget) * 100);
                return (
                  <div key={d.dept}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700 w-24">{d.dept}</span>
                      <span className="text-gray-500">{(d.used / 1000000).toFixed(1)}M / {(d.budget / 1000000).toFixed(0)}M VNĐ</span>
                    </div>
                    <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${pct > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detail Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Phòng ban</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Ngân sách</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Đã dùng</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">% Dùng</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">So tháng trước</th>
                </tr>
              </thead>
              <tbody>
                {deptReportData.map((d) => {
                  const pct = Math.round((d.used / d.budget) * 100);
                  const changePct = Math.round(((d.used - d.prevUsed) / d.prevUsed) * 100);
                  const positive = changePct > 0;
                  return (
                    <tr key={d.dept} className="border-b border-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{d.dept}</td>
                      <td className="px-4 py-3 text-right">{d.budget.toLocaleString('vi-VN')}</td>
                      <td className="px-4 py-3 text-right">{d.used.toLocaleString('vi-VN')}</td>
                      <td className="px-4 py-3 text-right font-medium">{pct}%</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`inline-flex items-center gap-1 text-sm font-medium ${positive ? 'text-red-600' : 'text-emerald-600'}`}>
                          {positive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                          {positive ? '+' : ''}{changePct}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-gray-50 font-bold">
                  <td className="px-4 py-3">Tổng</td>
                  <td className="px-4 py-3 text-right">{totalBudget.toLocaleString('vi-VN')}</td>
                  <td className="px-4 py-3 text-right">{totalUsed.toLocaleString('vi-VN')}</td>
                  <td className="px-4 py-3 text-right">{Math.round((totalUsed / totalBudget) * 100)}%</td>
                  <td className="px-4 py-3"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab !== 'dept' && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Báo cáo {tabs.find(t => t.key === activeTab)?.label} đang phát triển.</p>
        </div>
      )}
    </div>
  );
}
