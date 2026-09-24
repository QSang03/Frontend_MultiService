'use client';

import { useState } from 'react';
import { Save } from 'lucide-react';

export default function ApprovalSettingsB2B() {
  const [enabled, setEnabled] = useState(true);
  const [levels, setLevels] = useState('2');
  const [threshold1, setThreshold1] = useState('2000000');
  const [timeoutHours, setTimeoutHours] = useState('24');
  const [escalationHours, setEscalationHours] = useState('48');

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Cấu hình Luồng Phê duyệt</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        {/* Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Phê duyệt cấp bậc</h3>
            <p className="text-sm text-gray-500 mt-0.5">Khi TẮT, tất cả yêu cầu tự động duyệt bởi Admin.</p>
          </div>
          <button
            onClick={() => setEnabled(!enabled)}
            className={`relative w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-emerald-500' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? 'left-6' : 'left-0.5'}`} />
          </button>
        </div>

        {enabled && (
          <>
            {/* Levels */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số cấp phê duyệt</label>
              <select value={levels} onChange={(e) => setLevels(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="1">1 cấp (Admin duyệt)</option>
                <option value="2">2 cấp (Manager → Admin)</option>
                <option value="3">3 cấp (Staff → Manager → Admin)</option>
              </select>
            </div>

            {/* Threshold */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Ngưỡng tiền tệ theo cấp</label>
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Cấp 1 – Manager duyệt</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Giá trị từ 0 đến</span>
                    <input type="text" value={threshold1} onChange={(e) => setThreshold1(e.target.value)} className="w-40 px-3 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 text-right" />
                    <span className="text-sm text-gray-500">VNĐ</span>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Cấp 2 – Admin duyệt</p>
                  <p className="text-sm text-gray-500">Yêu cầu có giá trị &gt; {parseInt(threshold1).toLocaleString('vi-VN')} VNĐ (sau khi Manager duyệt Cấp 1)</p>
                </div>
              </div>
            </div>

            {/* Timeout */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Timeout tự động Escalation</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Nhắc nhở nếu chưa duyệt sau</p>
                  <div className="flex items-center gap-2">
                    <input type="text" value={timeoutHours} onChange={(e) => setTimeoutHours(e.target.value)} className="w-20 px-3 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 text-right" />
                    <span className="text-sm text-gray-500">giờ</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Escalate lên Admin sau</p>
                  <div className="flex items-center gap-2">
                    <input type="text" value={escalationHours} onChange={(e) => setEscalationHours(e.target.value)} className="w-20 px-3 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 text-right" />
                    <span className="text-sm text-gray-500">giờ</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-500 text-white rounded-lg font-medium text-sm hover:bg-emerald-600 transition-colors">
          <Save className="w-4 h-4" /> Lưu cấu hình
        </button>
      </div>
    </div>
  );
}
