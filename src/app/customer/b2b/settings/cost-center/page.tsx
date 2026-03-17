'use client';

import { useState, useEffect } from 'react';
import { Plus, AlertTriangle, Pencil, Trash2, Building, DollarSign, Check, X } from 'lucide-react';
import { useToast } from '@/components/ui';

interface CostCenter {
  id: string;
  orgId: string;
  code: string;
  name: string;
  allocatedBudget: number;
  currentSpent: number;
  isActive: boolean;
}

export default function CostCenterB2B() {
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [alertThreshold, setAlertThreshold] = useState('80');
  const [isAdding, setIsAdding] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newBudget, setNewBudget] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();

  const fetchCostCenters = async () => {
    try {
      const res = await fetch('/api/customer/b2b/settings/cost-center');
      const json = await res.json();
      if (json.success && json.data) {
        setCostCenters(json.data);
      }
    } catch (err) {
      console.error('Fetch cost centers error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCostCenters();
  }, []);

  const handleCreate = async () => {
    if (!newCode || !newName || !newBudget) {
      addToast('Vui lòng nhập đầy đủ mã, tên và hạn mức ngân sách', { type: 'error' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/customer/b2b/settings/cost-center', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newCode.trim().toUpperCase(),
          name: newName.trim(),
          allocatedBudget: parseFloat(newBudget),
        }),
      });
      const json = await res.json();
      if (json.success) {
        addToast('Thêm Cost Center thành công!', { type: 'success' });
        setNewCode('');
        setNewName('');
        setNewBudget('');
        setIsAdding(false);
        fetchCostCenters();
      } else {
        addToast(json.error || 'Lỗi khi thêm Cost Center', { type: 'error' });
      }
    } catch {
      addToast('Lỗi kết nối máy chủ', { type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const total = costCenters.reduce((sum, cc) => sum + cc.allocatedBudget, 0);
  const totalUsed = costCenters.reduce((sum, cc) => sum + cc.currentSpent, 0);

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Building className="w-6 h-6 text-emerald-600" />
            Trung tâm Chi phí & Ngân sách (Cost Centers)
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý hạn mức chi tiêu theo phòng ban và theo dõi tiến độ chi tiêu thực tế.
          </p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="inline-flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Thêm Cost Center
        </button>
      </div>

      {/* Modal Add */}
      {isAdding && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 text-sm">Thêm Trung tâm Chi phí mới</h3>
            <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Mã phòng (Code)</label>
              <input
                type="text"
                placeholder="VD: IT-02"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white uppercase font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Tên phòng ban</label>
              <input
                type="text"
                placeholder="VD: Phòng Kỹ thuật Hạ tầng"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Hạn mức ngân sách (VNĐ)</label>
              <input
                type="number"
                placeholder="VD: 50000000"
                value={newBudget}
                onChange={(e) => setNewBudget(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-100"
            >
              Hủy
            </button>
            <button
              onClick={handleCreate}
              disabled={submitting}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50"
            >
              {submitting ? 'Đang tạo...' : 'Lưu Cost Center'}
            </button>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-sm text-gray-500">Tổng hạn mức ngân sách</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {(total / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}M <span className="text-sm font-normal text-gray-500">VNĐ</span>
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-sm text-gray-500">Đã chi tiêu thực tế</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {(totalUsed / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}M <span className="text-sm font-normal text-gray-500">VNĐ</span>
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-sm text-gray-500">Ngân sách còn khả dụng</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {((total - totalUsed) / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}M <span className="text-sm font-normal text-gray-500">VNĐ</span>
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3.5 text-gray-600 font-semibold">Mã</th>
                <th className="text-left px-4 py-3.5 text-gray-600 font-semibold">Cost Center / Phòng ban</th>
                <th className="text-right px-4 py-3.5 text-gray-600 font-semibold">Ngân sách</th>
                <th className="text-right px-4 py-3.5 text-gray-600 font-semibold">Đã sử dụng</th>
                <th className="text-right px-4 py-3.5 text-gray-600 font-semibold">Còn lại</th>
                <th className="text-center px-4 py-3.5 text-gray-600 font-semibold">% Sử dụng</th>
                <th className="px-4 py-3.5"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : costCenters.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    Chưa có trung tâm chi phí nào. Nhấn &quot;Thêm Cost Center&quot; để tạo.
                  </td>
                </tr>
              ) : (
                costCenters.map((cc) => {
                  const pct = cc.allocatedBudget > 0 ? Math.round((cc.currentSpent / cc.allocatedBudget) * 100) : 0;
                  const remaining = cc.allocatedBudget - cc.currentSpent;
                  const isWarning = pct >= parseInt(alertThreshold, 10);

                  return (
                    <tr key={cc.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3.5 font-mono font-medium text-xs text-gray-600">{cc.code}</td>
                      <td className="px-4 py-3.5 font-medium text-gray-900">{cc.name}</td>
                      <td className="px-4 py-3.5 text-right text-gray-700 font-medium">
                        {cc.allocatedBudget.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="px-4 py-3.5 text-right text-gray-700 font-medium">
                        {cc.currentSpent.toLocaleString('vi-VN')} đ
                      </td>
                      <td
                        className={`px-4 py-3.5 text-right font-semibold ${
                          isWarning ? 'text-amber-600' : 'text-emerald-600'
                        }`}
                      >
                        {remaining.toLocaleString('vi-VN')} đ
                        {isWarning && <AlertTriangle className="w-3.5 h-3.5 inline ml-1 text-amber-500" />}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                          <span
                            className={`text-xs font-semibold ${
                              isWarning ? 'text-amber-600' : 'text-gray-600'
                            }`}
                          >
                            {pct}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded">
                          Hoạt động
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alert Config */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-2">Cảnh báo Vượt hạn mức Ngân sách</h3>
        <p className="text-sm text-gray-500 mb-4">
          Tự động gửi thông báo cho Admin & Quản lý phòng ban khi chi tiêu đạt ngưỡng kiểm soát.
        </p>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-700">Ngưỡng cảnh báo:</span>
          <input
            type="number"
            value={alertThreshold}
            onChange={(e) => setAlertThreshold(e.target.value)}
            className="w-20 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-center font-bold outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <span className="text-sm text-gray-700">% hạn mức ngân sách phòng ban</span>
        </div>
      </div>
    </div>
  );
}
