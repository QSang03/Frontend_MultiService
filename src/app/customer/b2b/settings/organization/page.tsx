'use client';

import { Building2, Save, Bell, Clock } from 'lucide-react';

export default function OrganizationSettingsB2B() {
  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Cài đặt Tổ chức</h1>

      {/* Company Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-gray-400" /> Thông tin Doanh nghiệp
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên công ty</label>
            <input type="text" defaultValue="ABC Corporation" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mã số thuế</label>
            <input type="text" defaultValue="0312345678" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
          <input type="text" defaultValue="123 Lê Lợi, Quận 1, TP.HCM" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Logo công ty</label>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-2xl font-bold text-gray-400">A</div>
            <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Upload ảnh</button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Bell className="w-5 h-5 text-gray-400" /> Cài đặt Thông báo
        </h3>
        <div className="space-y-3">
          {[
            { label: 'Email khi có yêu cầu mới cần duyệt', checked: true },
            { label: 'SMS khi ngân sách phòng ban vượt 80%', checked: true },
            { label: 'Zalo khi có vi phạm SLA', checked: true },
            { label: 'Email bảo dưỡng tài sản định kỳ', checked: true },
            { label: 'Nhắc gia hạn hợp đồng (trước 30 ngày)', checked: false },
          ].map((item, i) => (
            <label key={i} className="flex items-center justify-between py-2 cursor-pointer">
              <span className="text-sm text-gray-700">{item.label}</span>
              <input type="checkbox" defaultChecked={item.checked} className="w-4 h-4 text-emerald-500 rounded" />
            </label>
          ))}
        </div>
      </div>

      {/* SLA */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-400" /> SLA mặc định
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Critical', defaultVal: '2' },
            { label: 'High', defaultVal: '4' },
            { label: 'Medium', defaultVal: '24' },
            { label: 'Low', defaultVal: '72' },
          ].map((sla) => (
            <div key={sla.label}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{sla.label}</label>
              <div className="flex items-center gap-2">
                <input type="number" defaultValue={sla.defaultVal} className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 text-right" />
                <span className="text-sm text-gray-500">giờ</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 text-white rounded-xl font-medium text-sm hover:bg-emerald-600 transition-colors">
        <Save className="w-4 h-4" /> Lưu cài đặt
      </button>
    </div>
  );
}
