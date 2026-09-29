'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Truck, 
  Package, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Calculator, 
  Search,
  Building2,
  Layers,
  FileText
} from 'lucide-react';
import internalApiClient from '@/lib/api/internal-client';

export interface InboundPoItemSummary {
  id: string;
  skuCode: string;
  name: string;
  minStockLevel?: number;
  costingMethod: 'FIFO' | 'WEIGHTED_AVERAGE' | 'SPECIFIC_ID';
  totalQuantity?: number;
  avgCost?: number;
}

interface InboundPoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void> | void;
  items: InboundPoItemSummary[];
  initialItem?: InboundPoItemSummary | null;
}

const COMMON_VENDORS = [
  'FPT Synnex',
  'Digiworld (DGW)',
  'Phong Vũ Computer',
  'Viettel Distribution',
  'An Phát PC',
  'Hãng Dell Technologies VN',
  'Hãng HP Enterprise VN',
  'Cisco Systems VN',
];

export default function InboundPoModal({
  isOpen,
  onClose,
  onSuccess,
  items,
  initialItem,
}: InboundPoModalProps) {
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [searchItemQuery, setSearchItemQuery] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [vendor, setVendor] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [note, setNote] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Initialize or reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      const defaultItemId = initialItem?.id || (items.length > 0 ? items[0].id : '');
      setSelectedItemId(defaultItemId);
      setSearchItemQuery('');
      // Generate suggestion for PO number
      const today = new Date();
      const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      setPoNumber(`PO-${dateStr}-${randomSuffix}`);
      setVendor('');
      setBatchNumber(`LOT-${dateStr}-${randomSuffix}`);
      setQuantity('');
      setUnitCost('');
      setNote('');
      setError(null);
      setSuccessMessage(null);
    }
  }, [isOpen, initialItem, items]);

  const selectedItem = useMemo(() => {
    return items.find((i) => i.id === selectedItemId) || null;
  }, [items, selectedItemId]);

  const filteredItems = useMemo(() => {
    if (!searchItemQuery.trim()) return items;
    const q = searchItemQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.skuCode.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q)
    );
  }, [items, searchItemQuery]);

  // Real-time calculations
  const parsedQty = Math.max(0, parseFloat(quantity) || 0);
  const parsedCost = Math.max(0, parseFloat(unitCost) || 0);
  const totalAmount = parsedQty * parsedCost;

  // Weighted Average Cost calculation preview
  const costingPreview = useMemo(() => {
    if (!selectedItem || parsedQty <= 0 || parsedCost <= 0) return null;

    const currentQty = selectedItem.totalQuantity || 0;
    const currentAvgCost = selectedItem.avgCost || 0;

    if (selectedItem.costingMethod === 'WEIGHTED_AVERAGE') {
      const newTotalQty = currentQty + parsedQty;
      const newTotalValue = (currentQty * currentAvgCost) + (parsedQty * parsedCost);
      const newAvgCost = newTotalQty > 0 ? newTotalValue / newTotalQty : parsedCost;

      return {
        type: 'WEIGHTED_AVERAGE' as const,
        currentQty,
        currentAvgCost,
        inboundQty: parsedQty,
        inboundCost: parsedCost,
        newTotalQty,
        newAvgCost,
      };
    } else {
      return {
        type: 'FIFO' as const,
        currentQty,
        inboundQty: parsedQty,
        inboundCost: parsedCost,
        batchNumber: batchNumber || poNumber,
      };
    }
  }, [selectedItem, parsedQty, parsedCost, batchNumber, poNumber]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!selectedItem) {
      setError('Vui lòng chọn linh kiện / vật tư cần nhập kho');
      return;
    }

    if (!poNumber.trim()) {
      setError('Vui lòng nhập Mã đơn mua hàng (PO Number)');
      return;
    }

    if (parsedQty <= 0) {
      setError('Số lượng nhập phải lớn hơn 0');
      return;
    }

    if (parsedCost <= 0) {
      setError('Đơn giá nhập phải lớn hơn 0 đ');
      return;
    }

    setIsSubmitting(true);
    try {
      const vendorText = vendor.trim() ? `Vendor: ${vendor.trim()}` : '';
      const noteText = note.trim() ? `Ghi chú: ${note.trim()}` : '';
      const fullReason = `Inbound PO #${poNumber.trim()} | ${vendorText} ${noteText}`.trim();

      const response = await internalApiClient.post('/api/admin/inventory/stock', {
        itemId: selectedItem.id,
        type: 'TRANSACTION_TYPE_IN',
        quantity: parsedQty.toString(),
        unitCost: parsedCost.toString(),
        batchNumber: (batchNumber.trim() || poNumber.trim()),
        reason: fullReason,
      });

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      setSuccessMessage(
        `Nhập kho thành công PO ${poNumber}! Đã cộng thêm ${parsedQty} vào kho của SKU [${selectedItem.skuCode}].`
      );

      // Trigger refresh in parent
      await onSuccess();

      // Auto close after 1.5s
      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi nhập kho đơn hàng';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50/50 via-white to-indigo-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                Inbound Purchase Order
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  SRS III.8 Stock & Costing
                </span>
              </h2>
              <p className="text-xs text-gray-500">
                Nhập kho vật tư / linh kiện từ Nhà cung cấp và tự động chốt giá vốn
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="flex items-start gap-3 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-start gap-3 p-3.5 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* 1. Item Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-blue-600" />
                Linh kiện / SKU Nhập kho <span className="text-red-500">*</span>
              </label>
              <span className="text-xs text-gray-400">
                {items.length} sản phẩm khả dụng
              </span>
            </div>

            {/* Filter Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Tìm nhanh SKU hoặc tên sản phẩm..."
                value={searchItemQuery}
                onChange={(e) => setSearchItemQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>

            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
            >
              {filteredItems.map((item) => (
                <option key={item.id} value={item.id}>
                  [{item.skuCode}] {item.name} — Tồn: {item.totalQuantity ?? 0} | Cơ chế: {item.costingMethod}
                </option>
              ))}
            </select>

            {/* Item Current Details Badge */}
            {selectedItem && (
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80 flex items-center justify-between text-xs">
                <div>
                  <span className="text-gray-500">Tồn hiện tại:</span>{' '}
                  <span className="font-bold text-gray-900">{selectedItem.totalQuantity ?? 0} đơn vị</span>
                </div>
                <div>
                  <span className="text-gray-500">Giá vốn hiện tại:</span>{' '}
                  <span className="font-bold text-gray-900">
                    {(selectedItem.avgCost ?? 0).toLocaleString('vi-VN')} đ
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Phương pháp:</span>{' '}
                  <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                    {selectedItem.costingMethod === 'WEIGHTED_AVERAGE' ? 'Weighted Moving Avg' : selectedItem.costingMethod}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 2. PO & Vendor Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                Mã PO / Chứng từ Nhập <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                placeholder="VD: PO-2026-001"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                Nhà Cung Cấp (Vendor)
              </label>
              <div className="relative">
                <input
                  type="text"
                  list="vendor-options"
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  placeholder="Chọn hoặc nhập tên Nhà cung cấp..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                />
                <datalist id="vendor-options">
                  {COMMON_VENDORS.map((v) => (
                    <option key={v} value={v} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          {/* 3. Batch Number & Quantity & Unit Cost */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                Số Lô Hàng (Batch/Lot)
              </label>
              <input
                type="text"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                placeholder="Mặc định theo PO"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                Số Lượng Nhập <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Số lượng > 0"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-bold text-green-700 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-blue-600" />
                Đơn Giá Nhập (VNĐ) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="1000"
                required
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                placeholder="Giá vốn / đơn vị"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-bold text-blue-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Subtotal & Costing Impact Preview */}
          <div className="bg-gradient-to-br from-blue-50/60 to-indigo-50/60 rounded-xl p-4 border border-blue-200/70 space-y-3">
            <div className="flex items-center justify-between border-b border-blue-200/50 pb-2">
              <span className="text-xs font-semibold text-gray-600">Tổng giá trị đơn hàng (Total Inbound Value):</span>
              <span className="text-base font-extrabold text-blue-900">
                {totalAmount > 0 ? `${totalAmount.toLocaleString('vi-VN')} đ` : '0 đ'}
              </span>
            </div>

            {costingPreview && costingPreview.type === 'WEIGHTED_AVERAGE' && (
              <div className="text-xs space-y-1.5">
                <div className="flex items-center justify-between text-gray-700">
                  <span>Giá vốn bình quân mới (Dự kiến sau khi nhập):</span>
                  <span className="font-bold text-emerald-700 text-sm">
                    {Math.round(costingPreview.newAvgCost).toLocaleString('vi-VN')} đ
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 italic">
                  * Công thức WMA: [({costingPreview.currentQty} × {costingPreview.currentAvgCost.toLocaleString('vi-VN')}đ) + ({costingPreview.inboundQty} × {costingPreview.inboundCost.toLocaleString('vi-VN')}đ)] / {costingPreview.newTotalQty}
                </p>
              </div>
            )}

            {costingPreview && costingPreview.type === 'FIFO' && (
              <div className="text-xs text-gray-700">
                <p className="font-semibold text-blue-800">
                  Chiến lược FIFO (Nhập trước - Xuất trước):
                </p>
                <p className="text-[11px] text-gray-600 mt-0.5">
                  Lô hàng #{costingPreview.batchNumber} gồm {costingPreview.inboundQty} đơn vị @ {costingPreview.inboundCost.toLocaleString('vi-VN')} đ sẽ được xếp vào đầu hàng đợi xuất kho.
                </p>
              </div>
            )}
          </div>

          {/* 4. Notes */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Ghi chú nhập kho / Số hợp đồng / Hóa đơn đính kèm
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Hóa đơn GTGT số 009214, bảo hành chính hãng 36 tháng..."
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
            />
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-white hover:border-gray-400 transition-all shadow-sm"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            disabled={isSubmitting || !selectedItem || parsedQty <= 0 || parsedCost <= 0}
            onClick={handleSubmit}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 transition-all"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Đang xử lý nhập kho...
              </>
            ) : (
              <>
                <Truck className="w-4 h-4" />
                Xác nhận Nhập kho (Inbound PO)
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
