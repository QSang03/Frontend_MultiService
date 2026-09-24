'use client';

import React from 'react';
import { DollarSign, FileText } from 'lucide-react';
import { Button } from '@/components/ui';

interface PayoutModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  amount: string;
  note: string;
  maxAmount: number;
  onAmountChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  isLoading?: boolean;
  error?: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

export default function PayoutModal({
  open,
  onClose,
  onConfirm,
  amount,
  note,
  maxAmount,
  onAmountChange,
  onNoteChange,
  isLoading,
  error,
}: PayoutModalProps) {
  if (!open) return null;

  // Strip VN thousand separators (dots) and currency symbols, then parse
  const cleaned = amount.replace(/[₫\s]/g, '').replace(/\./g, '').replace(',', '.');
  const parsedRequestedAmount = Number.isFinite(Number(cleaned)) ? Number(cleaned) : 0;
  const isAmountInvalid = parsedRequestedAmount <= 0 || parsedRequestedAmount > maxAmount;
  const amountError = parsedRequestedAmount < 0
    ? 'Số tiền không được âm'
    : parsedRequestedAmount > maxAmount
    ? `Vượt quá số dư khả dụng (${formatCurrency(maxAmount)})`
    : parsedRequestedAmount === 0 && amount.trim() !== ''
    ? 'Số tiền không hợp lệ'
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="payout-title"
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="p-8">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <DollarSign className="w-8 h-8 text-blue-600" aria-hidden="true" />
            </div>
            <h3 id="payout-title" className="text-xl font-bold text-gray-900 mb-2">Tạo yêu cầu rút commission</h3>
            <p className="text-gray-500 text-sm mb-6">
              Nhập số tiền muốn rút từ số dư khả dụng và ghi chú nếu cần cho kế toán đối soát.
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              Số dư khả dụng hiện tại: <span className="font-semibold">{formatCurrency(maxAmount)}</span>
            </div>

            <div>
              <label htmlFor="payout-amount" className="block text-sm font-medium text-gray-700 mb-1">
                Số tiền yêu cầu
              </label>
              <input
                id="payout-amount"
                type="text"
                inputMode="numeric"
                value={amount}
                onChange={(event) => onAmountChange(event.target.value)}
                placeholder="Ví dụ: 1500000"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                disabled={isLoading}
              />
              <p className="mt-1 text-xs text-gray-500">
                {parsedRequestedAmount > 0
                  ? <>Bạn đang yêu cầu rút <span className="font-medium text-gray-700">{formatCurrency(parsedRequestedAmount)}</span></>
                  : 'Nhập số tiền muốn rút (VD: 1500000)'}
              </p>
              {amountError && (
                <p className="mt-1 text-xs text-red-600">{amountError}</p>
              )}
            </div>

            <div>
              <label htmlFor="payout-note" className="block text-sm font-medium text-gray-700 mb-1">
                Ghi chú
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <textarea
                  id="payout-note"
                  rows={4}
                  value={note}
                  onChange={(event) => onNoteChange(event.target.value)}
                  placeholder="Ví dụ: Rút commission đợt tháng 3"
                  className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  disabled={isLoading}
                />
              </div>
            </div>

            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-3 w-full">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              onClick={onConfirm}
              isLoading={isLoading}
              disabled={isLoading || isAmountInvalid}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Xác nhận
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
