'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, AlertTriangle, Calendar, Upload, Info } from 'lucide-react';

const categories = [
  { id: 'hardware', label: 'Phần cứng', icon: '🖥️' },
  { id: 'software', label: 'Phần mềm', icon: '💻' },
  { id: 'network', label: 'Mạng', icon: '🌐' },
  { id: 'subscription', label: 'License/Subscription', icon: '📋' },
  { id: 'maintenance', label: 'Bảo trì', icon: '🔧' },
  { id: 'other', label: 'Khác', icon: '📦' },
];

const costCenters = ['IT Department', 'Marketing', 'HR', 'Sales', 'Operations'];
const priorities = [
  { key: 'critical', label: 'Critical (2h)', color: 'border-red-500 bg-red-50 text-red-700' },
  { key: 'high', label: 'High (4h)', color: 'border-orange-500 bg-orange-50 text-orange-700' },
  { key: 'medium', label: 'Medium (24h)', color: 'border-yellow-500 bg-yellow-50 text-yellow-700' },
  { key: 'low', label: 'Low (72h)', color: 'border-gray-400 bg-gray-50 text-gray-700' },
];

export default function CreateTicketB2B() {
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [costCenter, setCostCenter] = useState('');
  const [estimatedAmount, setEstimatedAmount] = useState('');
  const [priority, setPriority] = useState('medium');
  const [location, setLocation] = useState('');

  const remainingBudget = 8500000;
  const estAmount = parseInt(estimatedAmount.replace(/\D/g, '')) || 0;
  const overBudget = estAmount > remainingBudget;

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto">
      <Link href="/customer/b2b/dashboard" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> Quay lại
      </Link>

      {/* Steps */}
      <div className="flex items-center gap-2 mb-8">
        {['Thông tin', 'Ngân sách', 'Ưu tiên', 'Xác nhận'].map((label, i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              step > i ? 'bg-emerald-500 text-white' : step === i + 1 ? 'bg-[#0f172a] text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {i + 1}
            </div>
            <span className="text-xs hidden md:inline text-gray-500">{label}</span>
            {i < 3 && <div className={`flex-1 h-0.5 ${step > i + 1 ? 'bg-emerald-500' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Info */}
      {step === 1 && (
        <div className="space-y-5">
          <h2 className="text-xl font-bold text-gray-900">Thông tin yêu cầu</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề <span className="text-red-500">*</span></label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="VD: Nâng cấp RAM cho 5 máy tính" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Danh mục dịch vụ</label>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((cat) => (
                <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`flex items-center gap-2 p-3 rounded-lg border-2 text-sm font-medium transition-all ${selectedCategory === cat.id ? 'border-emerald-500 bg-emerald-50' : 'border-gray-100 hover:border-gray-200'}`}>
                  <span>{cat.icon}</span>{cat.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả chi tiết</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Mô tả yêu cầu..." className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Địa điểm</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="VD: Tầng 3, Phòng IT" className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">File đính kèm</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-emerald-400 transition-colors cursor-pointer">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Kéo thả hoặc click để upload</p>
              <p className="text-xs text-gray-400 mt-1">Hỗ trợ: PDF, DOC, JPG, PNG (tối đa 10MB)</p>
            </div>
          </div>
          <button onClick={() => setStep(2)} className="w-full py-2.5 bg-[#0f172a] text-white rounded-lg font-medium text-sm hover:bg-[#1e293b] transition-colors">
            Tiếp tục →
          </button>
        </div>
      )}

      {/* Step 2: Cost Center */}
      {step === 2 && (
        <div className="space-y-5">
          <h2 className="text-xl font-bold text-gray-900">Phân bổ ngân sách</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Charge to Budget <span className="text-red-500">*</span>
            </label>
            <select value={costCenter} onChange={(e) => setCostCenter(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="">-- Chọn phòng ban / dự án --</option>
              {costCenters.map((cc) => (
                <option key={cc} value={cc}>{cc}</option>
              ))}
            </select>
          </div>
          {costCenter && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm">
              <p className="text-emerald-700">Ngân sách còn lại: <strong>{remainingBudget.toLocaleString('vi-VN')} VNĐ</strong></p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Giá trị ước tính (VNĐ)</label>
            <input type="text" value={estimatedAmount} onChange={(e) => setEstimatedAmount(e.target.value)} placeholder="VD: 5,000,000" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          {overBudget && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-700">
                <p className="font-medium">Vượt ngân sách!</p>
                <p>Ngân sách {costCenter} còn {remainingBudget.toLocaleString('vi-VN')} VNĐ. Yêu cầu này ước tính {estAmount.toLocaleString('vi-VN')} VNĐ.</p>
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú ngân sách</label>
            <input type="text" placeholder="Tùy chọn..." className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="px-6 py-2.5 border border-gray-200 rounded-lg text-gray-600 text-sm font-medium hover:bg-gray-50">Quay lại</button>
            <button onClick={() => setStep(3)} className="flex-1 py-2.5 bg-[#0f172a] text-white rounded-lg font-medium text-sm hover:bg-[#1e293b]">Tiếp tục →</button>
          </div>
        </div>
      )}

      {/* Step 3: Priority */}
      {step === 3 && (
        <div className="space-y-5">
          <h2 className="text-xl font-bold text-gray-900">Mức độ ưu tiên & SLA</h2>
          <div className="space-y-2">
            {priorities.map((p) => (
              <button key={p.key} onClick={() => setPriority(p.key)} className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 text-sm font-medium text-left transition-all ${priority === p.key ? p.color : 'border-gray-100 hover:border-gray-200'}`}>
                <div className={`w-3 h-3 rounded-full ${priority === p.key ? 'bg-current' : 'bg-gray-300'}`} />
                {p.label}
              </button>
            ))}
          </div>
          {(priority === 'critical' || priority === 'high') && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start gap-2 text-sm text-orange-700">
              <Info className="w-5 h-5 shrink-0 mt-0.5" />
              <p>Yêu cầu {priority === 'critical' ? 'Critical' : 'High'} ngoài giờ hành chính có thể phát sinh phụ phí.</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian mong muốn</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input type="datetime-local" className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="px-6 py-2.5 border border-gray-200 rounded-lg text-gray-600 text-sm font-medium hover:bg-gray-50">Quay lại</button>
            <button onClick={() => setStep(4)} className="flex-1 py-2.5 bg-[#0f172a] text-white rounded-lg font-medium text-sm hover:bg-[#1e293b]">Tiếp tục →</button>
          </div>
        </div>
      )}

      {/* Step 4: Confirm */}
      {step === 4 && (
        <div className="space-y-5">
          <h2 className="text-xl font-bold text-gray-900">Xác nhận & Gửi</h2>
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Tiêu đề:</span><span className="font-medium">{title || '—'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Danh mục:</span><span className="font-medium">{categories.find(c => c.id === selectedCategory)?.label || '—'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Cost Center:</span><span className="font-medium">{costCenter || '—'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Giá trị ước tính:</span><span className="font-medium">{estimatedAmount || '—'} VNĐ</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Mức độ:</span><span className="font-medium capitalize">{priority}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Địa điểm:</span><span className="font-medium">{location || '—'}</span></div>
          </div>

          {/* Approval Flow Preview */}
          <div className="bg-gray-50 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Luồng phê duyệt</h3>
            <div className="flex items-center gap-2 text-sm">
              <span className="px-3 py-1 bg-white border border-gray-200 rounded-lg">Bạn</span>
              <span className="text-gray-400">→</span>
              <span className="px-3 py-1 bg-white border border-gray-200 rounded-lg">Manager Trần Văn C</span>
              <span className="text-gray-400">→</span>
              <span className="px-3 py-1 bg-white border border-gray-200 rounded-lg">Admin Doanh nghiệp</span>
              <span className="text-gray-400">→</span>
              <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700">Nhà cung cấp</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(3)} className="px-6 py-2.5 border border-gray-200 rounded-lg text-gray-600 text-sm font-medium hover:bg-gray-50">Quay lại</button>
            <button className="flex-1 py-2.5 bg-emerald-500 text-white rounded-lg font-bold text-sm hover:bg-emerald-600">✅ Gửi yêu cầu</button>
          </div>
        </div>
      )}
    </div>
  );
}
