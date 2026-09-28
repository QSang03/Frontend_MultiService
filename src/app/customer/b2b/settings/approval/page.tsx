'use client';

import { useState, useEffect } from 'react';
import { Save, CheckCircle2, ShieldCheck, Clock, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui';

export default function ApprovalSettingsB2B() {
  const [enabled, setEnabled] = useState(true);
  const [levels, setLevels] = useState('2');
  const [threshold1, setThreshold1] = useState('2000000');
  const [threshold2, setThreshold2] = useState('10000000');
  const [timeoutHours, setTimeoutHours] = useState('24');
  const [escalationHours, setEscalationHours] = useState('48');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/customer/b2b/settings/approval');
        const json = await res.json();
        if (json.success && json.data) {
          setEnabled(json.data.enabled);
          setLevels(String(json.data.levels || 1));
          setThreshold1(String(json.data.threshold1 || 2000000));
          setThreshold2(String(json.data.threshold2 || 10000000));
          setTimeoutHours(String(json.data.timeoutHours || 24));
          setEscalationHours(String(json.data.escalationHours || 48));
        }
      } catch (err) {
        console.error('Fetch approval settings failed:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/customer/b2b/settings/approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled,
          levels: parseInt(levels, 10),
          threshold1: parseFloat(threshold1),
          threshold2: parseFloat(threshold2),
          timeoutHours: parseInt(timeoutHours, 10),
          escalationHours: parseInt(escalationHours, 10),
        }),
      });
      const json = await res.json();
      if (json.success) {
        addToast('Lưu cấu hình quy trình phê duyệt thành công!', { type: 'success' });
      } else {
        addToast(json.error || 'Lỗi khi lưu cấu hình', { type: 'error' });
      }
    } catch {
      addToast('Không thể kết nối đến máy chủ', { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-2xl mx-auto flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const numThreshold1 = parseInt(threshold1, 10) || 0;

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-emerald-600" />
          Cấu hình Luồng Phê duyệt B2B
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Thiết lập quy trình duyệt nhiều cấp và kiểm soát ngân sách theo hạn mức tổ chức.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6 shadow-sm">
        {/* Toggle Phê duyệt */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <h3 className="font-semibold text-gray-900">Kích hoạt Phê duyệt cấp bậc</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Khi TẮT, tất cả yêu cầu sẽ tự động được chuyển thẳng sang Admin hoặc nhà cung cấp.
            </p>
          </div>
          <button
            onClick={() => setEnabled(!enabled)}
            className={`relative w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-emerald-500' : 'bg-gray-300'
              }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? 'left-6' : 'left-0.5'
                }`}
            />
          </button>
        </div>

        {enabled && (
          <>
            {/* Số cấp duyệt */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số cấp phê duyệt
              </label>
              <select
                value={levels}
                onChange={(e) => setLevels(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="1">1 cấp (Chỉ Trưởng bộ phận / Admin duyệt)</option>
                <option value="2">2 cấp (Manager duyệt sơ bộ → Admin duyệt chi)</option>
                <option value="3">3 cấp (Trưởng nhóm → Manager → Giám đốc/Admin)</option>
              </select>
            </div>

            {/* Ngưỡng tiền tệ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Ngưỡng ngân sách phê duyệt (VNĐ)
              </label>
              <div className="space-y-3">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-800">Cấp 1 – Manager phê duyệt</span>
                    <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-medium">Bắt buộc</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Giá trị tối đa:</span>
                    <input
                      type="number"
                      value={threshold1}
                      onChange={(e) => setThreshold1(e.target.value)}
                      className="w-48 px-3 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 text-right font-medium"
                    />
                    <span className="text-sm font-medium text-gray-600">VNĐ</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">
                    Các yêu cầu ≤ {numThreshold1.toLocaleString('vi-VN')} VNĐ chỉ cần 1 cấp duyệt.
                  </p>
                </div>

                {levels !== '1' && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-800">Cấp 2 – Admin / Ban Giám Đốc</span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-medium">Cấp cao</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Áp dụng cho mọi yêu cầu có giá trị &gt; {numThreshold1.toLocaleString('vi-VN')} VNĐ (sau khi Manager Cấp 1 đã duyệt thông qua).
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Timeout & Escalation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-gray-500" />
                Thời gian xử lý & Tự động Leo thang (Escalation)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <p className="text-xs text-gray-600 mb-1 font-medium">Gửi nhắc nhở duyệt sau</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={timeoutHours}
                      onChange={(e) => setTimeoutHours(e.target.value)}
                      className="w-24 px-3 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 text-center font-bold"
                    />
                    <span className="text-sm text-gray-500">giờ</span>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <p className="text-xs text-gray-600 mb-1 font-medium">Tự động đẩy lên cấp trên sau</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={escalationHours}
                      onChange={(e) => setEscalationHours(e.target.value)}
                      className="w-24 px-3 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 text-center font-bold text-amber-600"
                    />
                    <span className="text-sm text-gray-500">giờ</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-lg font-semibold text-sm hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? 'Đang lưu...' : 'Lưu cấu hình quy trình'}
        </button>
      </div>
    </div>
  );
}
