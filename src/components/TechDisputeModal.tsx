'use client';

import React, { useState } from 'react';
import { X, AlertTriangle, Send, Upload, CheckCircle2, ShieldAlert } from 'lucide-react';

interface TechDisputeModalProps {
  jobId: string;
  jobTitle: string;
  memberName: string;
  currentPct: number;
  onClose: () => void;
  onSubmitSuccess: () => void;
}

export default function TechDisputeModal({
  jobId,
  jobTitle,
  memberName,
  currentPct,
  onClose,
  onSubmitSuccess,
}: TechDisputeModalProps) {
  const [proposedPct, setProposedPct] = useState(currentPct + 10);
  const [reason, setReason] = useState('');
  const [hasEvidence, setHasEvidence] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setTimeout(() => {
        onSubmitSuccess();
      }, 1500);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Khiếu Nại Tỷ Lệ Phân Bổ (SRS III.4)</h3>
              <p className="text-xs text-gray-500">Mã công việc: {jobId} • {jobTitle}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-gray-900 text-base">Đã gửi khiếu nại thành công!</h4>
            <p className="text-xs text-gray-600 max-w-sm mx-auto">
              Hồ sơ khiếu nại phân bổ đã được chuyển đến Admin & Ban Trọng Tài Kỹ Thuật. Quyết định sẽ được giải quyết trong vòng 48h.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-800 space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-amber-950">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                Quyền khiếu nại trong 24h Review Window:
              </span>
              <p>
                Nếu bạn không đồng ý với đánh giá Thời gian, Nỗ lực (Effort) hoặc Trách nhiệm (Lead), hãy cung cấp căn cứ để Admin xem xét điều chỉnh.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <span className="text-xs text-gray-500 block mb-1">Nhân sự khiếu nại</span>
                <span className="font-bold text-sm text-gray-800">{memberName}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <span className="text-xs text-gray-500 block mb-1">Tỷ lệ hiện tại</span>
                <span className="font-bold text-sm text-red-600 font-mono">{currentPct.toFixed(1)}%</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Tỷ lệ đề xuất mong muốn (%)
              </label>
              <div className="flex items-center gap-3">
                <input 
                  type="number" 
                  min="0"
                  max="100"
                  step="0.5"
                  value={proposedPct}
                  onChange={(e) => setProposedPct(Number(e.target.value))}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-xl text-sm font-bold font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
                <span className="text-xs text-gray-500">
                  Chênh lệch: +{(proposedPct - currentPct).toFixed(1)}%
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Lý do & Căn cứ kỹ thuật thực tế <span className="text-red-500">*</span>
              </label>
              <textarea 
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="VD: Tôi trực tiếp xử lý phân đoạn hàn cáp quang lõi chính trong 3.5 giờ, yêu cầu kỹ thuật phức tạp hơn mức đánh giá 20% effort..."
                className="w-full p-3 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Đính kèm bằng chứng (Log / Ảnh hiện trường / Biên bản kỹ thuật)
              </label>
              <div 
                onClick={() => setHasEvidence(!hasEvidence)}
                className={`p-3 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors text-xs font-medium ${
                  hasEvidence 
                    ? 'border-green-400 bg-green-50 text-green-700' 
                    : 'border-gray-200 hover:border-blue-400 text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Upload className="w-4 h-4" />
                {hasEvidence ? 'Đã đính kèm: evidence_onsite_log_2026.pdf (1.2 MB)' : 'Bấm để tải file bằng chứng'}
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !reason.trim()}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {isSubmitting ? 'Đang gửi...' : 'Gửi khiếu nại lên Admin'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}