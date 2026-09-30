'use client';

import React, { useState } from 'react';
import { Clock, PauseCircle, AlertCircle, X, ShieldAlert, Loader2, Calendar, Wrench, UserCheck } from 'lucide-react';

export type SlaPauseReason = 'PENDING_CUSTOMER' | 'PENDING_PARTS' | 'SCHEDULED';

interface SlaStopClockModalProps {
  isOpen: boolean;
  jobId: string;
  jobTitle: string;
  currentAttributes?: string;
  onClose: () => void;
  onSuccess: (result: {
    slaPaused: boolean;
    slaPauseReason?: string;
    slaPauseNotes?: string;
    slaPausedAt?: string;
    slaTotalPausedMinutes?: number;
    message?: string;
  }) => void;
}

const REASONS: Array<{
  key: SlaPauseReason;
  title: string;
  desc: string;
  icon: React.ElementType;
  badge: string;
  color: string;
}> = [
  {
    key: 'PENDING_CUSTOMER',
    title: 'Chờ Khách Hàng Phản Hồi (Pending Customer)',
    desc: 'Chờ khách hàng cung cấp mật khẩu quản trị, xác nhận lịch mở cửa Data Center / văn phòng, hoặc thực hiện nghiệm thu người dùng.',
    icon: UserCheck,
    badge: 'SRS III.7: Auto-close sau 3 ngày nếu không phản hồi',
    color: 'border-blue-200 hover:border-blue-500 bg-blue-50/30',
  },
  {
    key: 'PENDING_PARTS',
    title: 'Chờ Linh Kiện / Vendor RMA (Pending Parts)',
    desc: 'Linh kiện thay thế đặc chủng không có sẵn tại kho hoặc đang chuyển giao bảo hành từ hãng sản xuất theo quy trình RMA.',
    icon: Wrench,
    badge: 'Chờ nhập kho / linh kiện Vendor',
    color: 'border-amber-200 hover:border-amber-500 bg-amber-50/30',
  },
  {
    key: 'SCHEDULED',
    title: 'Đã Hẹn Lịch Triển Khai Cố Định (Scheduled)',
    desc: 'Đã chốt thời gian triển khai vào một thời điểm cố định trong tương lai. Đồng hồ SLA chỉ tiếp tục kích hoạt khi đến giờ hẹn.',
    icon: Calendar,
    badge: 'Đóng băng đếm ngược đến giờ hẹn',
    color: 'border-purple-200 hover:border-purple-500 bg-purple-50/30',
  },
];

export default function SlaStopClockModal({
  isOpen,
  jobId,
  jobTitle,
  currentAttributes,
  onClose,
  onSuccess,
}: SlaStopClockModalProps) {
  const [selectedReason, setSelectedReason] = useState<SlaPauseReason>('PENDING_CUSTOMER');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!notes.trim()) {
      setErrorMsg('Vui lòng nhập lý do giải trình chi tiết theo quy định kiểm soát SLA.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/tech/tasks/sla-pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: jobId,
          action: 'PAUSE',
          reason: selectedReason,
          notes: notes.trim(),
          currentAttributes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Không thể đóng băng đồng hồ SLA');
      }

      onSuccess(data);
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <PauseCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">Tạm Dừng SLA (Stop-the-Clock)</h3>
              <p className="text-xs text-amber-100 truncate max-w-sm">
                Đóng băng đồng hồ cam kết theo quy định SRS III.7
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Target Ticket Info */}
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between text-xs">
            <span className="text-gray-500">Mã yêu cầu / Ticket:</span>
            <span className="font-mono font-bold text-gray-800">{jobId}</span>
          </div>

          {/* SRS Notice */}
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2.5 text-xs text-amber-800">
            <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p>
              <strong>Bảo vệ chỉ số KPI:</strong> Khi quy trình bị nghẽn do yếu tố khách quan ngoài tầm kiểm soát của KTV, đồng hồ SLA sẽ được đóng băng tạm thời để không tính vào thời gian vi phạm SLA.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Reason Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-700 uppercase">
              Lý Do Đóng Băng SLA (Stop-the-Clock Reason) <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {REASONS.map((item) => {
                const Icon = item.icon;
                const isSelected = selectedReason === item.key;
                return (
                  <div
                    key={item.key}
                    onClick={() => setSelectedReason(item.key)}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/50 shadow-sm'
                        : `${item.color} border-gray-200 hover:border-gray-300`
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className={`text-xs font-bold ${isSelected ? 'text-amber-900' : 'text-gray-900'}`}>
                            {item.title}
                          </p>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{item.desc}</p>
                        <span className="inline-block mt-1 text-[10px] font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">
                          {item.badge}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Explanation Notes */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Ghi Chú Giải Trình Chi Tiết <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                setErrorMsg(null);
              }}
              placeholder="VD: Đã liên hệ anh Nam (IT Manager) nhưng đang họp đến 15:00 mới cung cấp được mật khẩu root switch..."
              className="w-full p-2.5 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={submitting}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <Clock className="w-4 h-4" />
                <span>Xác Nhận Đóng Băng SLA</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
