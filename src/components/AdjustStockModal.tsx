'use client';

import React, { useState } from 'react';
import { X, Package, TrendingUp, TrendingDown, AlertCircle, RotateCcw } from 'lucide-react';

type TransactionType = 'TRANSACTION_TYPE_IN' | 'TRANSACTION_TYPE_OUT' | 'TRANSACTION_TYPE_ADJUST' | 'TRANSACTION_TYPE_RMA';

interface AdjustStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AdjustStockData) => Promise<void>;
  item: {
    id: string;
    skuCode: string;
    name: string;
    currentStock?: number;
  } | null;
}

export interface AdjustStockData {
  itemId: string;
  type: TransactionType;
  quantity: string;
  unitCost: string;
  ticketId?: string;
  reason: string;
  batchNumber?: string;
}

const TRANSACTION_TYPES: { value: TransactionType; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'TRANSACTION_TYPE_IN', label: 'Inbound (Purchase)', icon: <TrendingUp className="w-4 h-4" />, color: 'text-green-600' },
  { value: 'TRANSACTION_TYPE_OUT', label: 'Outbound (Usage)', icon: <TrendingDown className="w-4 h-4" />, color: 'text-red-600' },
  { value: 'TRANSACTION_TYPE_ADJUST', label: 'Stock Adjustment', icon: <Package className="w-4 h-4" />, color: 'text-blue-600' },
  { value: 'TRANSACTION_TYPE_RMA', label: 'RMA', icon: <RotateCcw className="w-4 h-4" />, color: 'text-orange-600' },
];

export default function AdjustStockModal({ isOpen, onClose, onSubmit, item }: AdjustStockModalProps) {
  const [formData, setFormData] = useState<Omit<AdjustStockData, 'itemId'>>({
    type: 'TRANSACTION_TYPE_IN',
    quantity: '',
    unitCost: '',
    ticketId: '',
    reason: '',
    batchNumber: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!item) {
      setError('No item selected');
      return;
    }

    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }

    if (!formData.reason.trim()) {
      setError('Reason is required');
      return;
    }

    const isRma = formData.type === 'TRANSACTION_TYPE_RMA';
    const isAdjust = formData.type === 'TRANSACTION_TYPE_ADJUST';
    const isInbound = formData.type === 'TRANSACTION_TYPE_IN';

    // RMA: luôn giá 0
    let finalUnitCost = isRma ? '0' : (formData.unitCost || '0');

    if (isInbound) {
      const costValue = Number(finalUnitCost);
      if (!finalUnitCost || Number.isNaN(costValue) || costValue <= 0) {
        setError('Unit cost must be greater than 0 for this transaction type');
        return;
      }
    }

    if (isAdjust && formData.unitCost) {
      const costValue = Number(formData.unitCost);
      if (Number.isNaN(costValue) || costValue <= 0) {
        setError('Unit cost must be greater than 0 when provided');
        return;
      }
      finalUnitCost = formData.unitCost;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        itemId: item.id,
        ...formData,
        unitCost: finalUnitCost,
      });
      // Reset form
      setFormData({
        type: 'TRANSACTION_TYPE_IN',
        quantity: '',
        unitCost: '',
        ticketId: '',
        reason: '',
        batchNumber: '',
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to adjust stock');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !item) return null;

  const selectedType = TRANSACTION_TYPES.find(t => t.value === formData.type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Adjust Stock</h2>
              <p className="text-sm text-gray-500">{item.skuCode} - {item.name}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Current Stock Info */}
        {item.currentStock !== undefined && (
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
            <p className="text-sm text-gray-600">
              Current Stock: <span className="font-semibold text-gray-900">{item.currentStock} units</span>
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Transaction Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transaction Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TRANSACTION_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    type: type.value,
                    // RMA luôn giá 0; rời RMA thì bỏ giá đã auto-set để tránh giữ lại
                    unitCost: type.value === 'TRANSACTION_TYPE_RMA'
                      ? '0'
                      : prev.type === 'TRANSACTION_TYPE_RMA'
                        ? ''
                        : prev.unitCost,
                  }))}
                  className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors ${
                    formData.type === type.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <span className={type.color}>{type.icon}</span>
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {formData.type === 'TRANSACTION_TYPE_ADJUST' ? 'Số lượng tồn kho thực tế' : 'Quantity'} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="0"
                min="1"
                step="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              {formData.type === 'TRANSACTION_TYPE_ADJUST' && (
                <p className="text-xs text-gray-500 mt-1">Nhập tồn kho thực tế; hệ thống tự tính tăng/giảm.</p>
              )}
            </div>

            {/* Unit Cost */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit Cost (VND)
              </label>
              <input
                type="number"
                value={formData.type === 'TRANSACTION_TYPE_RMA' ? '0' : formData.unitCost}
                onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
                placeholder={formData.type === 'TRANSACTION_TYPE_RMA' ? '0 (auto)' : '0'}
                min="0"
                step="1000"
                disabled={formData.type === 'TRANSACTION_TYPE_RMA'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
              />
              {formData.type === 'TRANSACTION_TYPE_RMA' && (
                <p className="text-xs text-gray-500 mt-1">RMA: Giá tự động = 0 theo quy trình.</p>
              )}
              {formData.type === 'TRANSACTION_TYPE_ADJUST' && (
                <p className="text-xs text-gray-500 mt-1">Tùy chọn: chỉ cần khi điều chỉnh tăng mà chưa có giá vốn hiện tại.</p>
              )}
            </div>
          </div>

          {/* Batch Number */}
          {formData.type === 'TRANSACTION_TYPE_IN' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Batch Number
              </label>
              <input
                type="text"
                value={formData.batchNumber}
                onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                placeholder="e.g., BATCH-2026-001"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Optional: Auto-generated if empty</p>
            </div>
          )}

          {/* Ticket ID (for outbound/usage) */}
          {formData.type === 'TRANSACTION_TYPE_OUT' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Related Ticket ID
              </label>
              <input
                type="text"
                value={formData.ticketId}
                onChange={(e) => setFormData({ ...formData, ticketId: e.target.value })}
                placeholder="e.g., T-8812"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Enter reason for this stock adjustment..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              required
            />
          </div>

          {/* Preview */}
          {formData.quantity && (
            <div className={`p-3 rounded-lg ${
              formData.type === 'TRANSACTION_TYPE_OUT'
                ? 'bg-red-50 border border-red-200'
                : formData.type === 'TRANSACTION_TYPE_ADJUST'
                  ? 'bg-blue-50 border border-blue-200'
                  : 'bg-green-50 border border-green-200'
            }`}>
              <p className="text-sm">
                <span className={selectedType?.color}>
                  {selectedType?.icon}
                </span>
                {' '}
                {formData.type === 'TRANSACTION_TYPE_ADJUST'
                  ? <>Đặt tồn thực tế thành <span className="font-semibold">{formData.quantity} units</span> (hệ thống tự tính +/-)</>
                  : formData.type === 'TRANSACTION_TYPE_OUT'
                    ? <>Removing <span className="font-semibold">{formData.quantity} units</span></>
                    : <>Adding <span className="font-semibold">{formData.quantity} units</span></>
                }
                {formData.unitCost && formData.type !== 'TRANSACTION_TYPE_RMA' && (
                  <> at <span className="font-semibold">{parseInt(formData.unitCost).toLocaleString('vi-VN')} VND</span> each</>
                )}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Package className="w-4 h-4" />
                  Confirm Adjustment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
