'use client';

import React, { useState } from 'react';
import { GitMerge, UserCheck, MapPin, CheckCircle2, AlertCircle, X, Loader2, ArrowRight } from 'lucide-react';

interface ProfileMergeModalProps {
  isOpen: boolean;
  phone: string;
  guestCount: number;
  guestData: {
    fullName: string;
    address: string;
  };
  currentData: {
    fullName: string;
    address: string;
  };
  onClose: () => void;
  onSuccess: (count: number) => void;
}

export default function ProfileMergeModal({
  isOpen,
  phone,
  guestCount,
  guestData,
  currentData,
  onClose,
  onSuccess,
}: ProfileMergeModalProps) {
  const [nameChoice, setNameChoice] = useState<'current' | 'guest'>('current');
  const [addressChoice, setAddressChoice] = useState<'current' | 'guest'>('current');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleMerge = async () => {
    setSubmitting(true);
    setErrorMsg(null);

    const chosenName = nameChoice === 'current' ? currentData.fullName : guestData.fullName;
    const chosenAddress = addressChoice === 'current' ? currentData.address : guestData.address;

    try {
      const res = await fetch('/api/customer/b2c/profile/merge-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          nameChoice,
          addressChoice,
          chosenName,
          chosenAddress,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi hợp nhất dữ liệu');
      }

      onSuccess(data.mergedCount || guestCount);
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <GitMerge className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">Hợp Nhất Hồ Sơ Khách Hàng (Profile Merging)</h3>
              <p className="text-xs text-blue-100">
                SRS II.1.A • Fuzzy Matching &amp; Giải Quyết Xung Đột Dữ Liệu
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

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Explanation Alert */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 space-y-1">
            <p className="font-bold text-sm">
              Phát hiện {guestCount} yêu cầu dịch vụ trước đây gắn với số điện thoại: {phone}
            </p>
            <p className="text-blue-800 leading-relaxed">
              Bạn từng tạo ticket sửa chữa với tư cách khách vãng lai. Hệ thống sẽ tự động gán toàn bộ lịch sử sửa chữa và bảo hành vào tài khoản thành viên chính thức này.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Conflict Resolution Section */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Giải Quyết Xung Đột Dữ Liệu (Conflict Resolution)
            </h4>

            {/* Name Conflict */}
            <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-700 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  Họ và tên khách hàng:
                </span>
                <span className="text-[11px] text-gray-400">Chọn thông tin ưu tiên</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setNameChoice('current')}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    nameChoice === 'current'
                      ? 'border-blue-600 bg-blue-50/70 font-semibold text-blue-900 shadow-sm'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span className="block text-[10px] text-gray-400 uppercase">Tài khoản chính thức</span>
                  <span className="truncate block font-medium mt-0.5">{currentData.fullName || 'Nguyễn Văn A'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setNameChoice('guest')}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    nameChoice === 'guest'
                      ? 'border-blue-600 bg-blue-50/70 font-semibold text-blue-900 shadow-sm'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span className="block text-[10px] text-gray-400 uppercase">Từ đơn khách cũ</span>
                  <span className="truncate block font-medium mt-0.5">{guestData.fullName || 'Khach Vang Lai'}</span>
                </button>
              </div>
            </div>

            {/* Address Conflict */}
            <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-700 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  Địa chỉ giao nhận &amp; sửa chữa:
                </span>
                <span className="text-[11px] text-gray-400">Chọn thông tin ưu tiên</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setAddressChoice('current')}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    addressChoice === 'current'
                      ? 'border-blue-600 bg-blue-50/70 font-semibold text-blue-900 shadow-sm'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span className="block text-[10px] text-gray-400 uppercase">Tài khoản chính thức</span>
                  <span className="truncate block font-medium mt-0.5">{currentData.address}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAddressChoice('guest')}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    addressChoice === 'guest'
                      ? 'border-blue-600 bg-blue-50/70 font-semibold text-blue-900 shadow-sm'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span className="block text-[10px] text-gray-400 uppercase">Từ đơn khách cũ</span>
                  <span className="truncate block font-medium mt-0.5">{guestData.address}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-200 transition-colors"
          >
            Để sau
          </button>
          <button
            type="button"
            onClick={() => void handleMerge()}
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang hợp nhất...</span>
              </>
            ) : (
              <>
                <GitMerge className="w-4 h-4" />
                <span>Xác Nhận Hợp Nhất Hồ Sơ</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
