'use client';

import { useState } from 'react';
import { Plus, AlertTriangle, Pencil, Trash2 } from 'lucide-react';

interface CostCenter {
  id: string;
  name: string;
  budget: number;
  used: number;
}

const initialCostCenters: CostCenter[] = [
  { id: '1', name: 'IT Department', budget: 30000000, used: 12500000 },
  { id: '2', name: 'Marketing', budget: 20000000, used: 6200000 },
  { id: '3', name: 'Sales', budget: 25000000, used: 18000000 },
  { id: '4', name: 'HR', budget: 10000000, used: 2800000 },
  { id: '5', name: 'Operations', budget: 15000000, used: 4500000 },
];

export default function CostCenterB2B() {
  const [costCenters] = useState(initialCostCenters);
  const [alertThreshold, setAlertThreshold] = useState('80');

  const total = costCenters.reduce((sum, cc) => sum + cc.budget, 0);
  const totalUsed = costCenters.reduce((sum, cc) => sum + cc.used, 0);

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Cost Center & Ngân sách</h1>
        <button className="inline-flex items-center gap-1.5 bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors">
          <Plus className="w-4 h-4" /> Thêm Cost Center
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Tổng ngân sách</p>
          <p className="text-2xl font-bold text-gray-900">{(total / 1000000).toFixed(0)}M VNĐ</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Đã sử dụng</p>
          <p className="text-2xl font-bold text-blue-600">{(totalUsed / 1000000).toFixed(1)}M VNĐ</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Còn lại</p>
          <p className="text-2xl font-bold text-emerald-600">{((total - totalUsed) / 1000000).toFixed(1)}M VNĐ</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Cost Center</th>
              <th className="text-right px-4 py-3 text-gray-500 font-medium">Ngân sách tháng</th>
              <th className="text-right px-4 py-3 text-gray-500 font-medium">Đã dùng</th>
              <th className="text-right px-4 py-3 text-gray-500 font-medium">Còn lại</th>
              <th className="text-center px-4 py-3 text-gray-500 font-medium">% Dùng</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {costCenters.map((cc) => {
              const pct = Math.round((cc.used / cc.budget) * 100);
              const remaining = cc.budget - cc.used;
              const isWarning = pct >= parseInt(alertThreshold);
              return (
                <tr key={cc.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{cc.name}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{cc.budget.toLocaleString('vi-VN')}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{cc.used.toLocaleString('vi-VN')}</td>
                  <td className={`px-4 py-3 text-right font-medium ${isWarning ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {remaining.toLocaleString('vi-VN')} {isWarning && <AlertTriangle className="w-3.5 h-3.5 inline" />}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${isWarning ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                      <span className={`text-xs font-medium ${isWarning ? 'text-amber-600' : 'text-gray-500'}`}>{pct}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded"><Pencil className="w-3.5 h-3.5" /></button>
                      <button className="p-1.5 text-gray-400 hover:text-red-500 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Alert Config */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-3">Cài đặt cảnh báo</h3>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-sm text-gray-600">Gửi cảnh báo khi đạt</span>
          <input type="text" value={alertThreshold} onChange={(e) => setAlertThreshold(e.target.value)} className="w-16 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center outline-none focus:ring-2 focus:ring-emerald-500" />
          <span className="text-sm text-gray-600">% ngân sách đã dùng</span>
        </div>
        <div className="flex gap-3 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" defaultChecked className="w-4 h-4 text-emerald-500 rounded" /> Email</label>
          <label className="flex items-center gap-2"><input type="checkbox" defaultChecked className="w-4 h-4 text-emerald-500 rounded" /> SMS</label>
          <label className="flex items-center gap-2"><input type="checkbox" className="w-4 h-4 text-emerald-500 rounded" /> Zalo</label>
        </div>
      </div>
    </div>
  );
}
