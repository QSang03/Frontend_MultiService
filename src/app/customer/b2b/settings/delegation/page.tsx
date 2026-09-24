'use client';

import { useState } from 'react';
import { Calendar, Save, Info } from 'lucide-react';

export default function DelegationB2B() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [delegateTo, setDelegateTo] = useState('');
  const [scope, setScope] = useState('all');
  const [fallback, setFallback] = useState('');

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Ủy quyền Phê duyệt Tạm thời</h1>
      <p className="text-sm text-gray-500">Cấu hình ủy quyền khi bạn vắng mặt (nghỉ phép, du lịch). Ủy quyền sẽ tự động thu hồi khi hết hạn.</p>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        {/* Date Range */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vắng mặt từ</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>
        </div>

        {/* Delegate to */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ủy quyền cho</label>
          <select value={delegateTo} onChange={(e) => setDelegateTo(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500">
            <option value="">-- Chọn người nhận ủy quyền --</option>
            <option value="le_thi_d">Phó phòng Lê Thị D</option>
            <option value="pham_hai">Senior Manager Phạm Hải</option>
            <option value="admin">Admin Doanh nghiệp</option>
          </select>
        </div>

        {/* Scope */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phạm vi ủy quyền</label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="scope" value="all" checked={scope === 'all'} onChange={(e) => setScope(e.target.value)} className="w-4 h-4 text-emerald-500" />
              <span className="text-sm text-gray-700">Tất cả request trong thời gian này</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="scope" value="under_limit" checked={scope === 'under_limit'} onChange={(e) => setScope(e.target.value)} className="w-4 h-4 text-emerald-500" />
              <span className="text-sm text-gray-700">Chỉ request dưới 2,000,000 VNĐ</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="scope" value="specific" checked={scope === 'specific'} onChange={(e) => setScope(e.target.value)} className="w-4 h-4 text-emerald-500" />
              <span className="text-sm text-gray-700">Chỉ loại dịch vụ cụ thể</span>
            </label>
          </div>
        </div>

        {/* Fallback */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cấp ủy quyền tiếp theo (nếu người nhận cũng vắng)</label>
          <select value={fallback} onChange={(e) => setFallback(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500">
            <option value="">-- Chọn --</option>
            <option value="admin">Admin Doanh nghiệp</option>
            <option value="senior_mgr">Senior Manager</option>
          </select>
        </div>

        {/* Info */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2 text-sm text-amber-700">
          <Info className="w-5 h-5 shrink-0 mt-0.5" />
          <p>Ủy quyền sẽ tự động thu hồi vào {dateTo || '(ngày kết thúc)'}. Đảm bảo không bao giờ tắc nghẽn quy trình phê duyệt.</p>
        </div>

        <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-500 text-white rounded-lg font-medium text-sm hover:bg-emerald-600 transition-colors">
          <Save className="w-4 h-4" /> Lưu cài đặt ủy quyền
        </button>
      </div>

      {/* Active Delegations */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-3">Ủy quyền đang hoạt động</h3>
        <div className="text-sm text-gray-500 text-center py-6">
          Chưa có ủy quyền nào đang hoạt động.
        </div>
      </div>
    </div>
  );
}
