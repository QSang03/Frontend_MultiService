'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, AlertTriangle, Pencil, Trash2, Building, DollarSign, Check, X, Loader2, Power } from 'lucide-react';
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
  
  // Add modal state
  const [isAdding, setIsAdding] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newBudget, setNewBudget] = useState('');

  // Edit modal state
  const [editingCenter, setEditingCenter] = useState<CostCenter | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();

  const fetchCostCenters = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchCostCenters();
  }, [fetchCostCenters]);

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

  const handleUpdate = async () => {
    if (!editingCenter) return;
    if (!editingCenter.name || editingCenter.allocatedBudget <= 0) {
      addToast('Tên và hạn mức ngân sách phải hợp lệ', { type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/customer/b2b/settings/cost-center', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingCenter.id,
          name: editingCenter.name,
          allocatedBudget: Number(editingCenter.allocatedBudget),
          isActive: editingCenter.isActive,
        }),
      });
      const json = await res.json();
      if (json.success) {
        addToast(`Cập nhật trung tâm chi phí ${editingCenter.code} thành công!`, { type: 'success' });
        setEditingCenter(null);
        fetchCostCenters();
      } else {
        addToast(json.error || 'Cập nhật thất bại', { type: 'error' });
      }
    } catch {
      addToast('Lỗi kết nối máy chủ', { type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (cc: CostCenter) => {
    const nextStatus = !cc.isActive;
    try {
      const res = await fetch('/api/customer/b2b/settings/cost-center', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: cc.id,
          isActive: nextStatus,
        }),
      });
      const json = await res.json();
      if (json.success) {
        addToast(
          nextStatus ? `Đã kích hoạt lại Cost Center ${cc.code}` : `Đã tạm dừng Cost Center ${cc.code}`,
          { type: 'success' }
        );
        fetchCostCenters();
      } else {
        addToast(json.error || 'Lỗi cập nhật trạng thái', { type: 'error' });
      }
    } catch {
      addToast('Lỗi kết nối máy chủ', { type: 'error' });
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
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 text-sm">Thêm Trung tâm Chi phí mới</h3>
            <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Mã phòng (Code) *</label>
              <input
                type="text"
                placeholder="VD: IT-02"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white uppercase font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Tên phòng ban *</label>
              <input
                type="text"
                placeholder="VD: Phòng Kỹ thuật Hạ tầng"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Hạn mức ngân sách (VNĐ) *</label>
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
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Lưu Cost Center
            </button>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tổng Ngân Sách Phân Bổ</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{total.toLocaleString('vi-VN')} đ</p>
          <p className="text-xs text-gray-400 mt-1">{costCenters.length} trung tâm chi phí</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Đã Chi Tiêu Thực Tế</p>
          <p className="text-2xl font-bold text-amber-600 mt-2">{totalUsed.toLocaleString('vi-VN')} đ</p>
          <p className="text-xs text-gray-400 mt-1">
            {total > 0 ? Math.round((totalUsed / total) * 100) : 0}% tổng ngân sách
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ngân Sách Còn Lại</p>
          <p className="text-2xl font-bold text-emerald-600 mt-2">{(total - totalUsed).toLocaleString('vi-VN')} đ</p>
          <p className="text-xs text-gray-400 mt-1">Khả dụng cho các yêu cầu mới</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 text-sm">Danh Sách Trung Tâm Chi Phí</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200 text-xs">
              <tr>
                <th className="px-4 py-3">Mã phòng</th>
                <th className="px-4 py-3">Tên phòng ban</th>
                <th className="px-4 py-3 text-right">Hạn mức</th>
                <th className="px-4 py-3 text-right">Đã chi</th>
                <th className="px-4 py-3 text-right">Còn lại</th>
                <th className="px-4 py-3 text-center">Tiến độ</th>
                <th className="px-4 py-3 text-center">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-500" />
                  </td>
                </tr>
              ) : costCenters.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500">
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
                      <td className="px-4 py-3.5 font-mono font-bold text-xs text-gray-700">{cc.code}</td>
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
                              className={`h-full rounded-full ${isWarning ? 'bg-amber-500' : 'bg-emerald-500'}`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                          <span className={`text-xs font-semibold ${isWarning ? 'text-amber-600' : 'text-gray-600'}`}>
                            {pct}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                            cc.isActive !== false
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-gray-100 text-gray-500 border-gray-200'
                          }`}
                        >
                          {cc.isActive !== false ? 'Hoạt động' : 'Tạm dừng'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setEditingCenter(cc)}
                            title="Chỉnh sửa Cost Center"
                            className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(cc)}
                            title={cc.isActive !== false ? 'Tạm dừng Cost Center' : 'Kích hoạt lại'}
                            className={`p-1.5 rounded-lg transition-colors ${
                              cc.isActive !== false
                                ? 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                                : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingCenter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <Pencil className="w-5 h-5 text-emerald-600" />
                Chỉnh sửa Cost Center ({editingCenter.code})
              </h3>
              <button onClick={() => setEditingCenter(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Mã phòng (Không đổi)</label>
                <input
                  type="text"
                  disabled
                  value={editingCenter.code}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 font-mono text-gray-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Tên phòng ban *</label>
                <input
                  type="text"
                  value={editingCenter.name}
                  onChange={(e) => setEditingCenter({ ...editingCenter, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Hạn mức ngân sách (VNĐ) *</label>
                <input
                  type="number"
                  value={editingCenter.allocatedBudget}
                  onChange={(e) =>
                    setEditingCenter({ ...editingCenter, allocatedBudget: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Trạng thái hoạt động</label>
                <select
                  value={editingCenter.isActive ? 'active' : 'inactive'}
                  onChange={(e) => setEditingCenter({ ...editingCenter, isActive: e.target.value === 'active' })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="active">Đang hoạt động</option>
                  <option value="inactive">Tạm dừng áp dụng</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingCenter(null)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleUpdate}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

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
