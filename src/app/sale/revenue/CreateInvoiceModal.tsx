'use client';

import React, { useState } from 'react';
import { X, CreditCard, Banknote } from 'lucide-react';
import { Button } from '@/components/ui';

interface Invoice {
  id: string;
  client: string;
  amount: number;
  dueDate: string;
  status: string;
  method: string;
}

interface CreateInvoiceModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (invoice: Invoice) => void;
}

export default function CreateInvoiceModal({ open, onClose, onSuccess }: CreateInvoiceModalProps) {
  const [formData, setFormData] = useState({
    contractId: '',
    amount: '',
    dueDate: '',
    method: 'bank_transfer',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [amountError, setAmountError] = useState('');

  const [contracts, setContracts] = useState<{ id: string; title: string; customerName: string; totalValue?: number }[]>([]);
  const [fetchingContracts, setFetchingContracts] = useState(false);

  React.useEffect(() => {
    if (open) {
      setFetchingContracts(true);
      fetch('/api/contracts?pageSize=50')
        .then((r) => r.json())
        .then((data) => {
          const list = data?.data?.contracts || data?.contracts || [];
          setContracts(
            list.map((c: { id: string; title?: string; customerName?: string; customerId?: string; totalValue?: number }) => ({
              id: c.id,
              title: c.title || 'Hợp đồng dịch vụ',
              customerName: c.customerName || c.customerId || 'Khách hàng',
              totalValue: c.totalValue,
            }))
          );
        })
        .catch(() => setContracts([]))
        .finally(() => setFetchingContracts(false));
    }
  }, [open]);

  if (!open) return null;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d]/g, '');
    setFormData({ ...formData, amount: raw });
    if (raw && Number(raw) <= 0) {
      setAmountError('Số tiền phải lớn hơn 0');
    } else {
      setAmountError('');
    }
  };

  const displayAmount = formData.amount
    ? new Intl.NumberFormat('vi-VN').format(Number(formData.amount))
    : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Number(formData.amount);
    if (!parsed || parsed <= 0) {
      setAmountError('Vui lòng nhập số tiền hợp lệ');
      return;
    }
    setIsLoading(true);
    try {
      const newInvoice: Invoice = {
        id: `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
        client: formData.contractId || 'Khách hàng',
        amount: parsed,
        dueDate: formData.dueDate,
        status: 'pending_verification',
        method: formData.method,
      };
      onSuccess(newInvoice);
      onClose();
      setFormData({ contractId: '', amount: '', dueDate: '', method: 'bank_transfer' });
      setAmountError('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-invoice-title"
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 id="create-invoice-title" className="text-lg font-semibold text-gray-900">Tạo hóa đơn</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Select Contract/Quote */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Chọn báo giá / hợp đồng</label>
            <select
              className="w-full h-10 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              value={formData.contractId}
              onChange={(e) => {
                const selected = contracts.find((c) => `${c.title} (${c.customerName})` === e.target.value);
                setFormData({
                  ...formData,
                  contractId: e.target.value,
                  amount: selected?.totalValue ? String(selected.totalValue) : formData.amount,
                });
              }}
              required
            >
              <option value="">
                {fetchingContracts ? 'Đang tải danh sách hợp đồng...' : 'Chọn hợp đồng hoặc báo giá...'}
              </option>
              {contracts.map((ctr) => (
                <option key={ctr.id} value={`${ctr.title} (${ctr.customerName})`}>
                  {ctr.title} - {ctr.customerName} (#{ctr.id.slice(0, 8)})
                </option>
              ))}
              {!fetchingContracts && contracts.length === 0 && (
                <option value="Hợp đồng vãng lai">Hợp đồng dịch vụ tự do (Không theo mẫu)</option>
              )}
            </select>
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Số tiền hóa đơn (₫)</label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={displayAmount}
                onChange={handleAmountChange}
                required
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  amountError ? 'border-red-400 focus:ring-red-400' : 'border-gray-200'
                }`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">₫</span>
            </div>
            {amountError && <p className="text-xs text-red-500">{amountError}</p>}
          </div>

          {/* Due Date */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Hạn thanh toán</label>
            <input
              type="date"
              className="w-full h-10 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              required
            />
          </div>

          {/* Payment Method */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">Phương thức thanh toán</label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                formData.method === 'bank_transfer'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }`}>
                <input
                  type="radio"
                  name="payment_method"
                  value="bank_transfer"
                  checked={formData.method === 'bank_transfer'}
                  onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                  className="hidden"
                />
                <CreditCard className="w-5 h-5" aria-hidden="true" />
                <span className="text-sm font-medium">Chuyển khoản</span>
              </label>
              <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                formData.method === 'cash'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }`}>
                <input
                  type="radio"
                  name="payment_method"
                  value="cash"
                  checked={formData.method === 'cash'}
                  onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                  className="hidden"
                />
                <Banknote className="w-5 h-5" aria-hidden="true" />
                <span className="text-sm font-medium">Tiền mặt</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Tạo hóa đơn
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
