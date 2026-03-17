'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  MapPin,
  AlertTriangle,
  Calendar,
  Camera,
  X,
} from 'lucide-react';

const categories = [
  { id: 'computer', label: 'Sửa máy tính', icon: '💻' },
  { id: 'printer', label: 'Sửa máy in', icon: '🖨️' },
  { id: 'network', label: 'Mạng & Internet', icon: '🌐' },
  { id: 'software', label: 'Cài đặt phần mềm', icon: '📱' },
  { id: 'cloud', label: 'Cloud & Server', icon: '☁️' },
  { id: 'security', label: 'Bảo mật', icon: '🔒' },
];

// Dynamic form fields per category (Schema-driven)
const dynamicFields: Record<string, Array<{
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'boolean' | 'textarea';
  required?: boolean;
  options?: string[];
  defaultValue?: string | boolean;
  placeholder?: string;
}>> = {
  printer: [
    { key: 'counter', label: 'Số Counter', type: 'number', required: true, placeholder: 'Nhập số counter hiện tại' },
    { key: 'ink_status', label: 'Tình trạng mực', type: 'select', required: true, options: ['Còn mực', 'Hết mực', 'Không rõ'] },
    { key: 'model', label: 'Model máy in', type: 'text', placeholder: 'VD: Canon LBP 2900' },
  ],
  computer: [
    { key: 'os', label: 'Hệ điều hành', type: 'select', options: ['Windows 10', 'Windows 11', 'macOS', 'Linux', 'Khác'] },
    { key: 'backup', label: 'Cần backup dữ liệu?', type: 'boolean', defaultValue: true },
    { key: 'symptoms', label: 'Triệu chứng lỗi', type: 'textarea', required: true, placeholder: 'Mô tả chi tiết triệu chứng...' },
  ],
  software: [
    { key: 'software_name', label: 'Tên phần mềm', type: 'text', required: true, placeholder: 'VD: Microsoft Office 365' },
    { key: 'license', label: 'Đã có license?', type: 'boolean', defaultValue: false },
  ],
  network: [
    { key: 'network_type', label: 'Loại mạng', type: 'select', options: ['WiFi', 'LAN', 'VPN', 'Khác'] },
    { key: 'devices_affected', label: 'Số thiết bị ảnh hưởng', type: 'number', placeholder: 'VD: 5' },
  ],
};

export default function CreateTicketB2C() {
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState<'normal' | 'urgent'>('normal');
  const [address, setAddress] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [dynamicValues, setDynamicValues] = useState<Record<string, string | boolean>>({});
  const [attachments, setAttachments] = useState<string[]>([]);

  const fields = selectedCategory ? dynamicFields[selectedCategory] || [] : [];
  const basePrice = urgency === 'urgent' ? 750000 : 500000;
  const surcharge = urgency === 'urgent' ? 250000 : 0;

  const handleDynamicChange = (key: string, value: string | boolean) => {
    setDynamicValues((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto">
      {/* Back Button */}
      <Link href="/customer/b2c/dashboard" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> Quay lại
      </Link>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              step >= s ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {s}
            </div>
            <span className={`text-xs hidden sm:inline ${step >= s ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
              {s === 1 ? 'Chọn dịch vụ' : s === 2 ? 'Chi tiết' : 'Xác nhận'}
            </span>
            {s < 3 && <div className={`flex-1 h-0.5 ${step > s ? 'bg-blue-500' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Select Category */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Chọn loại dịch vụ</h2>
          <div className="grid grid-cols-2 gap-3">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { setSelectedCategory(cat.id); setStep(2); }}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                  selectedCategory === cat.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-100 bg-white hover:border-blue-200'
                }`}
              >
                <span className="text-2xl">{cat.icon}</span>
                <span className="font-medium text-gray-800">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Details */}
      {step === 2 && (
        <div className="space-y-5">
          <h2 className="text-xl font-bold text-gray-900">Chi tiết yêu cầu</h2>

          {/* Dynamic Fields from Schema */}
          {fields.length > 0 && (
            <div className="bg-blue-50/50 rounded-xl p-4 space-y-4">
              <p className="text-sm font-medium text-blue-700">Thông tin chuyên biệt</p>
              {fields.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  {field.type === 'text' || field.type === 'number' ? (
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      value={(dynamicValues[field.key] as string) || ''}
                      onChange={(e) => handleDynamicChange(field.key, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  ) : field.type === 'select' ? (
                    <select
                      value={(dynamicValues[field.key] as string) || ''}
                      onChange={(e) => handleDynamicChange(field.key, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      <option value="">-- Chọn --</option>
                      {field.options?.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : field.type === 'boolean' ? (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(dynamicValues[field.key] as boolean) ?? field.defaultValue ?? false}
                        onChange={(e) => handleDynamicChange(field.key, e.target.checked)}
                        className="w-4 h-4 text-blue-500 rounded"
                      />
                      <span className="text-sm text-gray-600">Có</span>
                    </label>
                  ) : field.type === 'textarea' ? (
                    <textarea
                      placeholder={field.placeholder}
                      value={(dynamicValues[field.key] as string) || ''}
                      onChange={(e) => handleDynamicChange(field.key, e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                    />
                  ) : null}
                </div>
              ))}
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả vấn đề <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Mô tả chi tiết vấn đề bạn gặp phải..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
            />
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ảnh đính kèm</label>
            <div className="flex gap-2 flex-wrap">
              {attachments.map((att, idx) => (
                <div key={idx} className="relative w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-xs text-gray-400">Ảnh {idx + 1}</span>
                  <button onClick={() => setAttachments(a => a.filter((_, i) => i !== idx))} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => setAttachments((a) => [...a, `photo_${a.length + 1}`])}
                className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
              >
                <Camera className="w-5 h-5" />
                <span className="text-xs mt-1">Thêm ảnh</span>
              </button>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Địa điểm phục vụ <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Nhập địa chỉ của bạn"
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Urgency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mức độ khẩn cấp</label>
            <div className="flex gap-3">
              <button
                onClick={() => setUrgency('normal')}
                className={`flex-1 p-3 rounded-xl border-2 text-center text-sm font-medium transition-all ${
                  urgency === 'normal' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                Bình thường
              </button>
              <button
                onClick={() => setUrgency('urgent')}
                className={`flex-1 p-3 rounded-xl border-2 text-center text-sm font-medium transition-all ${
                  urgency === 'urgent' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  Khẩn cấp (+50%)
                </div>
              </button>
            </div>
          </div>

          {/* Preferred Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian mong muốn</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="datetime-local"
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setStep(1)} className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium">
              Quay lại
            </button>
            <button onClick={() => setStep(3)} className="flex-1 px-6 py-2.5 rounded-xl bg-blue-500 text-white hover:bg-blue-600 text-sm font-medium">
              Tiếp tục
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && (
        <div className="space-y-5">
          <h2 className="text-xl font-bold text-gray-900">Xác nhận yêu cầu</h2>

          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Loại dịch vụ:</span>
              <span className="font-medium text-gray-900">{categories.find(c => c.id === selectedCategory)?.label}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Mức độ:</span>
              <span className={`font-medium ${urgency === 'urgent' ? 'text-orange-600' : 'text-gray-900'}`}>
                {urgency === 'urgent' ? '⚠️ Khẩn cấp' : 'Bình thường'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Địa chỉ:</span>
              <span className="font-medium text-gray-900">{address || 'Chưa nhập'}</span>
            </div>
            {description && (
              <div className="text-sm">
                <span className="text-gray-500">Mô tả:</span>
                <p className="mt-1 text-gray-700">{description}</p>
              </div>
            )}
          </div>

          {/* Price Breakdown */}
          <div className="bg-gray-50 rounded-xl p-5 space-y-2">
            <h3 className="font-semibold text-gray-900 mb-3">Chi phí ước tính</h3>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Giá dịch vụ cơ bản</span>
              <span className="font-medium">{basePrice.toLocaleString('vi-VN')} VNĐ</span>
            </div>
            {surcharge > 0 && (
              <div className="flex justify-between text-sm text-orange-600">
                <span>Phụ phí khẩn cấp (+50%)</span>
                <span className="font-medium">{surcharge.toLocaleString('vi-VN')} VNĐ</span>
              </div>
            )}
            <div className="border-t border-gray-200 pt-2 mt-2">
              <div className="flex justify-between font-bold">
                <span>Tổng ước tính</span>
                <span className="text-blue-600">{(basePrice + surcharge).toLocaleString('vi-VN')} VNĐ</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setStep(2)} className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium">
              Quay lại
            </button>
            <button className="flex-1 px-6 py-2.5 rounded-xl bg-blue-500 text-white hover:bg-blue-600 text-sm font-bold">
              ✅ Gửi yêu cầu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
