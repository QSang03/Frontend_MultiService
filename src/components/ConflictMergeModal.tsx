'use client';

import React, { useState } from 'react';
import { X, GitMerge, Check, AlertCircle, ArrowRight, UserCheck, ShieldCheck } from 'lucide-react';

interface ConflictMergeModalProps {
  isOpen: boolean;
  phone: string;
  guestProfile: {
    fullName: string;
    email?: string;
    address?: string;
    ticketCount: number;
    lastTicketDate: string;
  };
  newProfile: {
    fullName: string;
    email: string;
    address?: string;
  };
  onClose: () => void;
  onConfirmMerge: (resolutions: Record<string, string>) => void;
  onSkipMerge: () => void;
}

export default function ConflictMergeModal({
  isOpen,
  phone,
  guestProfile,
  newProfile,
  onClose,
  onConfirmMerge,
  onSkipMerge,
}: ConflictMergeModalProps) {
  // Choices for fields that differ: 'GUEST' | 'NEW'
  const [selectedName, setSelectedName] = useState<'GUEST' | 'NEW'>('NEW');
  const [selectedAddress, setSelectedAddress] = useState<'GUEST' | 'NEW'>('NEW');
  const [selectedEmail, setSelectedEmail] = useState<'GUEST' | 'NEW'>('NEW');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleMerge = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onConfirmMerge({
        fullName: selectedName === 'NEW' ? newProfile.fullName : guestProfile.fullName,
        address: selectedAddress === 'NEW' ? (newProfile.address || '') : (guestProfile.address || ''),
        email: selectedEmail === 'NEW' ? newProfile.email : (guestProfile.email || newProfile.email),
      });
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <GitMerge className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Phát Hiện Hồ Sơ Dịch Vụ Cũ</h3>
              <p className="text-xs text-gray-500">Số điện thoại: <strong className="text-blue-600">{phone}</strong></p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice */}
        <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-900 space-y-1">
          <span className="font-bold flex items-center gap-1.5 text-blue-950">
            <ShieldCheck className="w-4 h-4 text-blue-700" />
            Gộp hồ sơ khách vãng lai (Guest Profile Merging - SRS II.1.A):
          </span>
          <p className="leading-relaxed">
            Số điện thoại này đã từng tạo <strong>{guestProfile.ticketCount} yêu cầu dịch vụ</strong> trước đây. 
            Bạn có thể gộp toàn bộ lịch sử sửa chữa, bảo hành cũ vào tài khoản mới và chọn giữ lại thông tin chính xác nhất.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
            Chọn dữ liệu chính thức cho tài khoản
          </span>

          {/* Full Name */}
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
            <span className="text-xs font-bold text-gray-700 block">Họ và tên:</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label 
                onClick={() => setSelectedName('GUEST')}
                className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between ${
                  selectedName === 'GUEST' ? 'border-blue-600 bg-blue-50 font-bold text-blue-900' : 'border-gray-200 bg-white text-gray-600'
                }`}
              >
                <span>Cũ: {guestProfile.fullName}</span>
                {selectedName === 'GUEST' && <Check className="w-3.5 h-3.5 text-blue-600" />}
              </label>

              <label 
                onClick={() => setSelectedName('NEW')}
                className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between ${
                  selectedName === 'NEW' ? 'border-blue-600 bg-blue-50 font-bold text-blue-900' : 'border-gray-200 bg-white text-gray-600'
                }`}
              >
                <span>Mới: {newProfile.fullName}</span>
                {selectedName === 'NEW' && <Check className="w-3.5 h-3.5 text-blue-600" />}
              </label>
            </div>
          </div>

          {/* Address */}
          {(guestProfile.address || newProfile.address) && (
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
              <span className="text-xs font-bold text-gray-700 block">Địa chỉ phục vụ mặc định:</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <label 
                  onClick={() => setSelectedAddress('GUEST')}
                  className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between ${
                    selectedAddress === 'GUEST' ? 'border-blue-600 bg-blue-50 font-bold text-blue-900' : 'border-gray-200 bg-white text-gray-600'
                  }`}
                >
                  <span className="truncate">Cũ: {guestProfile.address || 'Chưa lưu'}</span>
                  {selectedAddress === 'GUEST' && <Check className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />}
                </label>

                <label 
                  onClick={() => setSelectedAddress('NEW')}
                  className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between ${
                    selectedAddress === 'NEW' ? 'border-blue-600 bg-blue-50 font-bold text-blue-900' : 'border-gray-200 bg-white text-gray-600'
                  }`}
                >
                  <span className="truncate">Mới: {newProfile.address || 'Địa chỉ nhập mới'}</span>
                  {selectedAddress === 'NEW' && <Check className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />}
                </label>
              </div>
            </div>
          )}

          {/* Automatic Inherit items */}
          <div className="p-3 bg-green-50/60 rounded-xl border border-green-200 text-xs text-green-900 flex items-center justify-between">
            <div>
              <span className="font-bold block">Tự động kế thừa lịch sử dịch vụ:</span>
              <p className="text-[11px] text-green-700">
                Toàn bộ {guestProfile.ticketCount} ticket, biên bản bảo hành & lịch sử sửa chữa sẽ được liên kết vào tài khoản mới.
              </p>
            </div>
            <span className="px-2 py-0.5 rounded bg-green-200 text-green-800 font-bold text-[10px] flex-shrink-0">
              +{guestProfile.ticketCount} Tickets
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={onSkipMerge}
            className="text-xs text-gray-500 hover:text-gray-800 font-medium px-2 py-1"
          >
            Bỏ qua, không gộp lịch sử cũ
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleMerge}
              disabled={isProcessing}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 active:scale-[0.99] disabled:opacity-50"
            >
              <GitMerge className="w-3.5 h-3.5" />
              {isProcessing ? 'Đang gộp...' : 'Xác nhận Gộp Hồ Sơ'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}