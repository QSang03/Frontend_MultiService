'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, MapPin, AlertTriangle, Calendar, Upload, Info, CheckCircle2, Building2, Wrench } from 'lucide-react';
import { useToast } from '@/components/ui';

interface CostCenter {
  id: string;
  code: string;
  name: string;
  allocatedBudget: number;
  currentSpent: number;
  isActive: boolean;
}

const categories = [
  { id: 'hardware', label: 'Phần cứng & Thiết bị IT', desc: 'Máy in, server, laptop, màn hình' },
  { id: 'software', label: 'Phần mềm & Bản quyền', desc: 'HĐH, Office 365, ERP, CRM' },
  { id: 'network', label: 'Mạng & Hạ tầng viễn thông', desc: 'Router, switch, cáp mạng, Wi-Fi' },
  { id: 'maintenance', label: 'Bảo trì định kỳ', desc: 'Vệ sinh, tra keo, kiểm tra định kỳ' },
  { id: 'other', label: 'Yêu cầu khác', desc: 'Hỗ trợ kỹ thuật tổng hợp' },
];

const priorities = [
  { key: 'critical', label: 'Khẩn cấp (SLA 2h)', color: 'border-red-500 bg-red-50 text-red-700' },
  { key: 'high', label: 'Ưu tiên cao (SLA 4h)', color: 'border-orange-500 bg-orange-50 text-orange-700' },
  { key: 'medium', label: 'Bình thường (SLA 24h)', color: 'border-yellow-500 bg-yellow-50 text-yellow-700' },
  { key: 'low', label: 'Thấp (SLA 72h)', color: 'border-gray-400 bg-gray-50 text-gray-700' },
];

function CreateTicketB2BContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToast();

  const assetSerial = searchParams.get('asset');

  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState(assetSerial ? 'maintenance' : 'hardware');
  const [title, setTitle] = useState(
    assetSerial ? `Bảo dưỡng định kỳ thiết bị [${assetSerial}]` : ''
  );
  const [description, setDescription] = useState(
    assetSerial
      ? `Yêu cầu kiểm tra & bảo dưỡng kỹ thuật phòng ngừa định kỳ (Preventive Maintenance - SRS III.6) cho thiết bị mã số ${assetSerial}.`
      : ''
  );
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [selectedCostCenterId, setSelectedCostCenterId] = useState('');
  const [estimatedAmount, setEstimatedAmount] = useState('5000000');
  const [priority, setPriority] = useState('medium');
  const [location, setLocation] = useState('Văn phòng chính – Tầng 4');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (assetSerial) {
      setSelectedCategory('maintenance');
      setTitle((prev) => prev || `Bảo dưỡng định kỳ thiết bị [${assetSerial}]`);
      setDescription(
        (prev) =>
          prev ||
          `Yêu cầu kiểm tra & bảo dưỡng kỹ thuật phòng ngừa định kỳ (Preventive Maintenance - SRS III.6) cho thiết bị mã số ${assetSerial}.`
      );
    }
  }, [assetSerial]);

  useEffect(() => {
    async function loadCostCenters() {
      try {
        const res = await fetch('/api/customer/b2b/settings/cost-center');
        const json = await res.json();
        if (json.success && json.data && json.data.length > 0) {
          setCostCenters(json.data);
          setSelectedCostCenterId(json.data[0].id);
        }
      } catch (e) {
        console.error('Error fetching cost centers', e);
      }
    }
    loadCostCenters();
  }, []);

  const selectedCC = costCenters.find((c) => c.id === selectedCostCenterId);
  const remainingBudget = selectedCC ? selectedCC.allocatedBudget - selectedCC.currentSpent : 0;
  const estAmount = parseInt(estimatedAmount.replace(/\D/g, ''), 10) || 0;
  const overBudget = estAmount > remainingBudget;

  const handleSubmit = async () => {
    if (!title) {
      addToast('Vui lòng nhập tiêu đề yêu cầu', { type: 'error' });
      setStep(1);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/customer/b2b/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          categoryId: selectedCategory,
          priority,
          costCenterId: selectedCostCenterId,
          estimatedAmount: estAmount,
          attributes: JSON.stringify({ location, assetSerial: assetSerial || undefined }),
        }),
      });
      const json = await res.json();
      if (json.success) {
        addToast('Yêu cầu đã được gửi và chuyển vào luồng phê duyệt!', { type: 'success' });
        router.push('/customer/b2b/tickets');
      } else {
        addToast(json.error || 'Lỗi khi gửi yêu cầu', { type: 'error' });
      }
    } catch {
      addToast('Lỗi kết nối máy chủ', { type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto">
      <Link
        href="/customer/b2b/dashboard"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 font-medium text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Quay lại Dashboard
      </Link>

      {/* Auto-Prefill Preventive Maintenance Banner (SRS III.6) */}
      {assetSerial && (
        <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900 uppercase">Bảo Trì Dự Phòng (SRS III.6)</p>
              <p className="text-sm font-semibold text-gray-800">
                Thiết bị: <span className="font-mono text-amber-700">{assetSerial}</span>
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-amber-200/60 text-amber-900 font-semibold">
            Auto-Prefilled
          </span>
        </div>
      )}

      {/* Steps Indicator */}
      <div className="flex items-center gap-2 mb-8">
        {['Thông tin', 'Ngân sách', 'Mức độ ưu tiên', 'Xác nhận'].map((label, i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step > i
                  ? 'bg-emerald-500 text-white'
                  : step === i + 1
                    ? 'bg-[#0f172a] text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
            >
              {i + 1}
            </div>
            <span className="text-xs hidden md:inline text-gray-500 font-medium">{label}</span>
            {i < 3 && <div className={`flex-1 h-0.5 ${step > i + 1 ? 'bg-emerald-500' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Thông tin dịch vụ */}
      {step === 1 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">Bước 1: Chọn dịch vụ & Mô tả vấn đề</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Danh mục dịch vụ</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`p-3.5 text-left rounded-lg border text-sm transition-all ${selectedCategory === cat.id
                      ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                      : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  <p className="font-semibold text-gray-900">{cat.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{cat.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề yêu cầu</label>
            <input
              type="text"
              placeholder="VD: Nâng cấp RAM và thay thế quạt tản nhiệt máy chủ"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả chi tiết</label>
            <textarea
              rows={4}
              placeholder="Mô tả hiện trạng sự cố, dòng máy, mã thiết bị hoặc yêu cầu kỹ thuật cụ thể..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Địa điểm thực hiện</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => {
                if (!title) {
                  addToast('Vui lòng nhập tiêu đề yêu cầu', { type: 'error' });
                  return;
                }
                setStep(2);
              }}
              className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-semibold text-sm hover:bg-emerald-700"
            >
              Tiếp tục: Phân bổ Ngân sách →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Ngân sách & Cost Center */}
      {step === 2 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">Bước 2: Phân bổ Trung tâm Chi phí & Dự toán</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tính vào phòng ban / Trung tâm chi phí (Cost Center)
            </label>
            <select
              value={selectedCostCenterId}
              onChange={(e) => setSelectedCostCenterId(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              {costCenters.map((cc) => (
                <option key={cc.id} value={cc.id}>
                  [{cc.code}] {cc.name} (Khả dụng: {(cc.allocatedBudget - cc.currentSpent).toLocaleString('vi-VN')} đ)
                </option>
              ))}
            </select>
          </div>

          {selectedCC && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Hạn mức ngân sách tháng:</span>
                <span className="font-semibold text-gray-800">{selectedCC.allocatedBudget.toLocaleString('vi-VN')} đ</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Đã chi tiêu:</span>
                <span className="font-semibold text-blue-600">{selectedCC.currentSpent.toLocaleString('vi-VN')} đ</span>
              </div>
              <div className="flex justify-between text-sm pt-1 border-t border-slate-200">
                <span className="text-gray-700 font-medium">Ngân sách còn lại:</span>
                <span className={`font-bold ${remainingBudget <= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {remainingBudget.toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dự toán kinh phí ước tính (VNĐ)</label>
            <input
              type="text"
              value={estimatedAmount}
              onChange={(e) => setEstimatedAmount(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {overBudget && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 flex items-start gap-2.5 text-sm text-amber-800">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Cảnh báo: Dự toán vượt quá ngân sách phòng ban!</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Yêu cầu này sẽ tự động kích hoạt cấp phê duyệt bổ sung của Ban Giám Đốc/Admin sau khi Manager thông qua.
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-600 text-sm font-medium hover:bg-gray-50"
            >
              Quay lại
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg font-semibold text-sm hover:bg-emerald-700"
            >
              Tiếp tục: Chọn mức độ ưu tiên →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Priority */}
      {step === 3 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">Bước 3: Mức độ ưu tiên & Thời hạn cam kết SLA</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {priorities.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setPriority(p.key)}
                className={`p-4 rounded-xl border-2 text-left font-medium text-sm transition-all ${priority === p.key ? p.color + ' ring-2 ring-offset-1' : 'border-gray-200 hover:border-gray-300'
                  }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setStep(2)}
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-600 text-sm font-medium hover:bg-gray-50"
            >
              Quay lại
            </button>
            <button
              onClick={() => setStep(4)}
              className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg font-semibold text-sm hover:bg-emerald-700"
            >
              Tiếp tục: Xem lại & Gửi yêu cầu →
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Xác nhận & Gửi */}
      {step === 4 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">Bước 4: Xác nhận thông tin</h2>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Tiêu đề yêu cầu:</span>
              <span className="font-semibold text-gray-900">{title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Danh mục:</span>
              <span className="font-medium text-gray-800">{categories.find((c) => c.id === selectedCategory)?.label}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Phòng ban (Cost Center):</span>
              <span className="font-medium text-gray-800">{selectedCC?.name} ({selectedCC?.code})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Dự toán ước tính:</span>
              <span className="font-bold text-emerald-700">{estAmount.toLocaleString('vi-VN')} đ</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Mức độ ưu tiên:</span>
              <span className="font-semibold uppercase text-gray-800">{priority}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Địa điểm:</span>
              <span className="font-medium text-gray-800">{location}</span>
            </div>
          </div>

          {/* Workflow Preview */}
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-emerald-900 mb-2 uppercase tracking-wide">
              Quy trình phê duyệt tự động
            </p>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2.5 py-1 bg-white border border-gray-200 rounded font-medium">1. Người tạo yêu cầu</span>
              <span className="text-gray-400">→</span>
              <span className="px-2.5 py-1 bg-white border border-gray-200 rounded font-medium">2. Trưởng phòng ({selectedCC?.name})</span>
              {estAmount > 2000000 && (
                <>
                  <span className="text-gray-400">→</span>
                  <span className="px-2.5 py-1 bg-white border border-gray-200 rounded font-medium text-blue-700">3. Admin Doanh nghiệp (Cấp 2)</span>
                </>
              )}
              <span className="text-gray-400">→</span>
              <span className="px-2.5 py-1 bg-emerald-600 text-white rounded font-bold">4. Kỹ thuật viên tiếp nhận</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setStep(3)}
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-600 text-sm font-medium hover:bg-gray-50"
            >
              Quay lại
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 py-3 bg-emerald-600 text-white rounded-lg font-bold text-sm hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              {submitting ? 'Đang gửi yêu cầu...' : 'Xác nhận & Gửi yêu cầu'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CreateTicketB2B() {
  return (
    <Suspense
      fallback={
        <div className="p-8 max-w-3xl mx-auto flex flex-col items-center justify-center py-20 text-gray-500 gap-3">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium">Đang tải biểu mẫu tạo yêu cầu dịch vụ...</p>
        </div>
      }
    >
      <CreateTicketB2BContent />
    </Suspense>
  );
}

