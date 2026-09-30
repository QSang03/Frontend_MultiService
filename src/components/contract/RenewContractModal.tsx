'use client';

import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Calendar, Loader2, Clock } from 'lucide-react';
import Button from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';

interface RenewContractModalProps {
  open: boolean;
  contract: {
    id: string;
    title: string;
    endDate?: string;
  } | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RenewContractModal({
  open,
  contract,
  onClose,
  onSuccess,
}: RenewContractModalProps) {
  const [newEndDate, setNewEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (open && contract) {
      setErrorMsg(null);
      setNotes('');
      // Default to +12 months from current end date or now
      let baseDate = new Date();
      if (contract.endDate && !isNaN(new Date(contract.endDate).getTime())) {
        baseDate = new Date(contract.endDate);
      }
      baseDate.setFullYear(baseDate.getFullYear() + 1);
      setNewEndDate(baseDate.toISOString().split('T')[0]);
    }
  }, [open, contract]);

  const handleApplyPreset = (months: number) => {
    let baseDate = new Date();
    if (contract?.endDate && !isNaN(new Date(contract.endDate).getTime())) {
      baseDate = new Date(contract.endDate);
    }
    baseDate.setMonth(baseDate.getMonth() + months);
    setNewEndDate(baseDate.toISOString().split('T')[0]);
  };

  const handleRenew = async () => {
    if (!contract) return;
    if (!newEndDate) {
      setErrorMsg('Vui lòng chọn ngày kết thúc mới');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/contracts/${contract.id}/renew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newEndDate,
          notes: notes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gia hạn hợp đồng không thành công');
      }

      toast.success('Yêu cầu gia hạn hợp đồng đã được phê duyệt thành công!');
      onSuccess();
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gia hạn hợp đồng thất bại');
      toast.error(err instanceof Error ? err.message : 'Gia hạn hợp đồng thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open || !contract) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Gia Hạn Hợp Đồng</h2>
              <p className="text-xs text-gray-500 font-mono">Mã: #{contract.id.slice(-8)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-200 text-xs space-y-1.5">
            <div className="flex justify-between items-start">
              <span className="text-gray-500 font-medium">Hợp đồng:</span>
              <span className="font-semibold text-gray-900 text-right">{contract.title}</span>
            </div>
            {contract.endDate && (
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Ngày hết hạn hiện tại:</span>
                <span className="font-semibold text-amber-600">{contract.endDate}</span>
              </div>
            )}
          </div>

          {/* Quick presets */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Chọn thời gian gia hạn nhanh</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleApplyPreset(3)}
                className="py-1.5 px-3 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
              >
                + 3 Tháng
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset(6)}
                className="py-1.5 px-3 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
              >
                + 6 Tháng
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset(12)}
                className="py-1.5 px-3 border border-emerald-300 bg-emerald-50/50 rounded-lg text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
              >
                + 1 Năm
              </button>
            </div>
          </div>

          {/* Date picker */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Thời hạn hiệu lực mới đến ngày <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                value={newEndDate}
                onChange={(e) => setNewEndDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Ghi chú hoặc yêu cầu điều chỉnh</label>
            <textarea
              rows={2}
              placeholder="VD: Gia hạn dịch vụ hỗ trợ IT Onsite theo gói tiêu chuẩn hiện hành..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <Button variant="outline" size="sm" onClick={onClose} disabled={submitting}>
            Hủy bỏ
          </Button>
          <Button
            size="sm"
            onClick={handleRenew}
            isLoading={submitting}
            disabled={!newEndDate || submitting}
            leftIcon={submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Xác nhận gia hạn
          </Button>
        </div>
      </div>
    </div>
  );
}
