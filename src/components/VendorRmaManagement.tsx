'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  RotateCcw,
  AlertTriangle,
  Clock,
  Plus,
  Search,
  RefreshCw,
  ArrowRightLeft,
  CheckCircle,
  Truck,
  Building2,
  DollarSign,
  X,
  Send,
  ShieldAlert,
} from 'lucide-react';
import internalApiClient from '@/lib/api/internal-client';

export interface VendorRmaDto {
  id: string;
  rmaNumber: string;
  itemId: string;
  vendorName: string;
  originalSerialNumber: string;
  replacedSerialNumber?: string;
  status: string;
  defectDescription: string;
  vendorRefNumber?: string;
  shippingCostCents: number;
  unitCostCents: number;
  ticketId?: string;
  sentAt?: string;
  receivedAt?: string;
  completedAt?: string;
  notes?: string;
  isOverdue: boolean;
  daysAtVendor: number;
  createdAt?: string;
  updatedAt?: string;
}

interface InventoryItemOption {
  id: string;
  skuCode: string;
  name: string;
}

export default function VendorRmaManagement() {
  const [rmas, setRmas] = useState<VendorRmaDto[]>([]);
  const [items, setItems] = useState<InventoryItemOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [onlyOverdueFilter, setOnlyOverdueFilter] = useState(false);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [selectedRmaForSwap, setSelectedRmaForSwap] = useState<VendorRmaDto | null>(null);
  const [replacementSerial, setReplacementSerial] = useState('');
  const [swapNotes, setSwapNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create Form State
  const [createForm, setCreateForm] = useState({
    itemId: '',
    vendorName: '',
    originalSerialNumber: '',
    defectDescription: '',
    vendorRefNumber: '',
    shippingCostCents: 0,
    ticketId: '',
  });

  const fetchRmas = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, string | boolean> = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (onlyOverdueFilter) params.onlyOverdue = true;

      const res = await internalApiClient.get<{ rmas: VendorRmaDto[] }>('/api/admin/inventory/rma', {
        params,
      });
      setRmas(res.data?.rmas || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải danh sách RMA';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, onlyOverdueFilter]);

  const fetchItems = useCallback(async () => {
    try {
      const res = await internalApiClient.get<{ items: InventoryItemOption[] }>('/api/admin/inventory/items');
      setItems(res.data?.items || []);
    } catch {
      // Non-critical if failed
    }
  }, []);

  useEffect(() => {
    fetchRmas();
    fetchItems();
  }, [fetchRmas, fetchItems]);

  // Handle status transition
  const handleUpdateStatus = async (rmaId: string, newStatus: string) => {
    if (newStatus === 'RESTOCKED') {
      const confirmed = window.confirm(
        'Xác nhận Nhập kho Thiết bị đã bảo hành (Zero Cost Restock)?\n\nHệ thống sẽ tự động cập nhật tồn kho với Giá vốn COGS = 0đ theo chuẩn SRS III.8.'
      );
      if (!confirmed) return;
    }

    try {
      setIsSubmitting(true);
      await internalApiClient.put('/api/admin/inventory/rma', {
        rmaId,
        status: newStatus,
      });
      fetchRmas();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Cập nhật trạng thái thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle swap serial submission
  const handleSwapSerialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRmaForSwap || !replacementSerial.trim()) return;

    try {
      setIsSubmitting(true);
      await internalApiClient.put('/api/admin/inventory/rma', {
        rmaId: selectedRmaForSwap.id,
        replacedSerialNumber: replacementSerial.trim(),
        notes: swapNotes,
      });
      setIsSwapModalOpen(false);
      setSelectedRmaForSwap(null);
      setReplacementSerial('');
      setSwapNotes('');
      fetchRmas();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Đổi Serial thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle create RMA submission
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.itemId || !createForm.vendorName || !createForm.originalSerialNumber) {
      alert('Vui lòng điền đủ thông tin thiết bị, nhà cung cấp và Serial Number');
      return;
    }

    try {
      setIsSubmitting(true);
      await internalApiClient.post('/api/admin/inventory/rma', createForm);
      setIsCreateModalOpen(false);
      setCreateForm({
        itemId: '',
        vendorName: '',
        originalSerialNumber: '',
        defectDescription: '',
        vendorRefNumber: '',
        shippingCostCents: 0,
        ticketId: '',
      });
      fetchRmas();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Tạo hồ sơ RMA thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered RMAs
  const filteredRmas = rmas.filter((r) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      r.rmaNumber.toLowerCase().includes(q) ||
      r.originalSerialNumber.toLowerCase().includes(q) ||
      (r.replacedSerialNumber && r.replacedSerialNumber.toLowerCase().includes(q)) ||
      r.vendorName.toLowerCase().includes(q) ||
      (r.vendorRefNumber && r.vendorRefNumber.toLowerCase().includes(q))
    );
  });

  // KPI calculations
  const totalRmas = rmas.length;
  const inProgressCount = rmas.filter((r) => ['SENT_TO_VENDOR', 'VENDOR_IN_PROGRESS', 'PENDING_SHIPMENT'].includes(r.status)).length;
  const overdueCount = rmas.filter((r) => r.isOverdue).length;
  const restockedCount = rmas.filter((r) => r.status === 'RESTOCKED').length;

  return (
    <div className="space-y-6">
      {/* Header and KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase">Tổng RMA</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{totalRmas}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <RotateCcw className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase">Đang tại Hãng</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{inProgressCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-red-200 p-4 flex items-center justify-between shadow-sm">
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold text-red-600 uppercase">Quá Hạn &gt; 15 Ngày</p>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            </div>
            <p className="text-2xl font-bold text-red-600 mt-1">{overdueCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-green-200 p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-green-700 uppercase">Đã Trả Về (Zero COGS)</p>
            <p className="text-2xl font-bold text-green-700 mt-1">{restockedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-green-50 text-green-700 flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Top Controls */}
        <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-[280px]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm mã RMA, Serial Number, Nhà cung cấp..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PENDING_SHIPMENT">Chờ gửi hãng</option>
              <option value="SENT_TO_VENDOR">Đã gửi hãng</option>
              <option value="VENDOR_IN_PROGRESS">Hãng đang xử lý</option>
              <option value="RECEIVED">Đã nhận từ hãng</option>
              <option value="RESTOCKED">Đã nhập kho (Zero COGS)</option>
              <option value="SCRAPPED">Hủy thiết bị (Scrapped)</option>
            </select>

            <button
              onClick={() => setOnlyOverdueFilter(!onlyOverdueFilter)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                onlyOverdueFilter
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Chỉ quá hạn &gt; 15 ngày
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchRmas}
              disabled={isLoading}
              className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              title="Tải lại"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Tạo Hồ Sơ RMA
            </button>
          </div>
        </div>

        {/* Overdue Banner Warning */}
        {overdueCount > 0 && !onlyOverdueFilter && (
          <div className="bg-red-50 border-b border-red-200 px-4 py-2.5 flex items-center justify-between text-xs text-red-800">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-600" />
              <span>
                Cảnh báo: Có <strong>{overdueCount} thiết bị</strong> đã gửi bảo hành quá 15 ngày chưa được hãng xử lý
                hoàn tất. Vui lòng liên hệ Vendor để thúc đẩy tiến độ SLA!
              </span>
            </div>
            <button
              onClick={() => setOnlyOverdueFilter(true)}
              className="text-red-700 hover:text-red-900 font-bold underline"
            >
              Xem ngay
            </button>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-4 bg-red-50 text-red-700 text-sm flex items-center gap-2 border-b border-red-100">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/75 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-4">Mã RMA / Phiếu</th>
                <th className="py-3 px-4">Serial Gốc / Đổi Mới</th>
                <th className="py-3 px-4">Hãng Bảo Hành</th>
                <th className="py-3 px-4">Lỗi &amp; Ghi Chú</th>
                <th className="py-3 px-4 text-center">Thời Gian Tại Hãng</th>
                <th className="py-3 px-4 text-center">Trạng Thái</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {isLoading && rmas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                    Đang tải dữ liệu RMA từ máy chủ...
                  </td>
                </tr>
              ) : filteredRmas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    Không tìm thấy hồ sơ bảo hành nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredRmas.map((rma) => {
                  const isOverdue = rma.isOverdue;
                  return (
                    <tr
                      key={rma.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        isOverdue ? 'bg-red-50/30' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-blue-600 font-mono text-xs">
                          {rma.rmaNumber}
                        </div>
                        {rma.ticketId && (
                          <div className="text-[11px] text-gray-400">Ticket: {rma.ticketId.slice(0, 8)}...</div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-mono text-xs font-semibold text-gray-800">
                          {rma.originalSerialNumber}
                        </div>
                        {rma.replacedSerialNumber ? (
                          <div className="flex items-center gap-1 text-[11px] text-green-700 font-mono font-medium">
                            <ArrowRightLeft className="w-3 h-3" />
                            Đổi: {rma.replacedSerialNumber}
                          </div>
                        ) : (
                          <div className="text-[11px] text-gray-400">Chưa đổi Serial</div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-gray-400" />
                          {rma.vendorName}
                        </div>
                        {rma.vendorRefNumber && (
                          <div className="text-[11px] text-gray-500">Ref: {rma.vendorRefNumber}</div>
                        )}
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <div className="text-xs text-gray-700 line-clamp-1 font-medium">
                          {rma.defectDescription}
                        </div>
                        {rma.notes && (
                          <div className="text-[11px] text-gray-400 italic line-clamp-1">{rma.notes}</div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1">
                          <Clock className={`w-3.5 h-3.5 ${isOverdue ? 'text-red-500' : 'text-gray-400'}`} />
                          <span
                            className={`font-mono font-bold text-xs ${
                              isOverdue ? 'text-red-600' : 'text-gray-700'
                            }`}
                          >
                            {rma.daysAtVendor} ngày
                          </span>
                        </div>
                        {isOverdue && (
                          <span className="block text-[10px] font-bold text-red-600 bg-red-100 rounded px-1.5 py-0.5 mt-0.5 uppercase tracking-tight">
                            Quá hạn &gt;15d
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                            rma.status === 'RESTOCKED'
                              ? 'bg-green-100 text-green-800 border border-green-200'
                              : rma.status === 'RECEIVED'
                              ? 'bg-blue-100 text-blue-800'
                              : rma.status === 'VENDOR_IN_PROGRESS' || rma.status === 'SENT_TO_VENDOR'
                              ? 'bg-amber-100 text-amber-800'
                              : rma.status === 'SCRAPPED'
                              ? 'bg-gray-100 text-gray-600'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {rma.status === 'RESTOCKED'
                            ? 'Đã nhập kho (0đ COGS)'
                            : rma.status === 'RECEIVED'
                            ? 'Đã nhận từ hãng'
                            : rma.status === 'VENDOR_IN_PROGRESS'
                            ? 'Hãng đang xử lý'
                            : rma.status === 'SENT_TO_VENDOR'
                            ? 'Đã gửi hãng'
                            : rma.status === 'SCRAPPED'
                            ? 'Đã tiêu hủy'
                            : 'Chờ gửi hãng'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Swap serial button */}
                          <button
                            onClick={() => {
                              setSelectedRmaForSwap(rma);
                              setReplacementSerial(rma.replacedSerialNumber || '');
                              setIsSwapModalOpen(true);
                            }}
                            className="px-2.5 py-1 border border-gray-200 hover:border-blue-400 hover:text-blue-600 rounded text-xs font-medium transition-colors"
                            title="Đổi Serial từ hãng"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick transition buttons */}
                          {rma.status === 'PENDING_SHIPMENT' && (
                            <button
                              onClick={() => handleUpdateStatus(rma.id, 'SENT_TO_VENDOR')}
                              disabled={isSubmitting}
                              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-xs font-medium transition-colors"
                            >
                              Gửi Hãng
                            </button>
                          )}

                          {rma.status === 'SENT_TO_VENDOR' && (
                            <button
                              onClick={() => handleUpdateStatus(rma.id, 'VENDOR_IN_PROGRESS')}
                              disabled={isSubmitting}
                              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-medium transition-colors"
                            >
                              Đang Sửa
                            </button>
                          )}

                          {(rma.status === 'SENT_TO_VENDOR' || rma.status === 'VENDOR_IN_PROGRESS') && (
                            <button
                              onClick={() => handleUpdateStatus(rma.id, 'RECEIVED')}
                              disabled={isSubmitting}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors"
                            >
                              Đã Nhận
                            </button>
                          )}

                          {rma.status === 'RECEIVED' && (
                            <button
                              onClick={() => handleUpdateStatus(rma.id, 'RESTOCKED')}
                              disabled={isSubmitting}
                              className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-bold transition-colors shadow-sm"
                              title="Tự động nhập kho với Giá vốn COGS = 0đ"
                            >
                              Nhập Kho (0đ)
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create RMA */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-blue-600" />
                Tạo Hồ Sơ Bảo Hành Vendor RMA (SRS III.8)
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Chọn Thiết Bị / Phụ Tùng <span className="text-red-500">*</span>
                </label>
                <select
                  value={createForm.itemId}
                  onChange={(e) => setCreateForm({ ...createForm, itemId: e.target.value })}
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  required
                >
                  <option value="">-- Chọn linh kiện trong kho --</option>
                  {items.map((it) => (
                    <option key={it.id} value={it.id}>
                      [{it.skuCode}] {it.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Hãng / Nhà Cung Cấp <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={createForm.vendorName}
                    onChange={(e) => setCreateForm({ ...createForm, vendorName: e.target.value })}
                    placeholder="VD: HP, Canon, Dell, Cisco..."
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Serial Number Lỗi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={createForm.originalSerialNumber}
                    onChange={(e) => setCreateForm({ ...createForm, originalSerialNumber: e.target.value })}
                    placeholder="VD: SN-2026-X891..."
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Mô Tả Lỗi Kỹ Thuật <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={createForm.defectDescription}
                  onChange={(e) => setCreateForm({ ...createForm, defectDescription: e.target.value })}
                  placeholder="Mô tả hiện tượng lỗi cần thẩm định hoặc đổi mới..."
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Mã Phiếu Hãng (Vendor Ref #)</label>
                  <input
                    type="text"
                    value={createForm.vendorRefNumber}
                    onChange={(e) => setCreateForm({ ...createForm, vendorRefNumber: e.target.value })}
                    placeholder="VD: CASE-9812..."
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Ticket ID liên quan (nếu có)</label>
                  <input
                    type="text"
                    value={createForm.ticketId}
                    onChange={(e) => setCreateForm({ ...createForm, ticketId: e.target.value })}
                    placeholder="Mã phiếu sự cố..."
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSubmitting ? 'Đang tạo...' : 'Tạo RMA'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Swap Serial */}
      {isSwapModalOpen && selectedRmaForSwap && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-green-600" />
                Cập Nhật Serial Number Đổi Mới
              </h3>
              <button
                onClick={() => setIsSwapModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSwapSerialSubmit} className="space-y-3.5 text-xs">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div className="text-gray-500">Mã RMA: <strong className="text-gray-900 font-mono">{selectedRmaForSwap.rmaNumber}</strong></div>
                <div className="text-gray-500 mt-1">Serial cũ: <strong className="text-red-600 font-mono">{selectedRmaForSwap.originalSerialNumber}</strong></div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Serial Number Mới Nhận Từ Hãng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={replacementSerial}
                  onChange={(e) => setReplacementSerial(e.target.value)}
                  placeholder="Nhập Serial mới do hãng cung cấp..."
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 font-mono text-sm"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Ghi chú đổi serial</label>
                <textarea
                  rows={2}
                  value={swapNotes}
                  onChange={(e) => setSwapNotes(e.target.value)}
                  placeholder="Hãng đổi bo mạch mới / đổi sản phẩm nguyên seal..."
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsSwapModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !replacementSerial.trim()}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg flex items-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  {isSubmitting ? 'Đang lưu...' : 'Lưu Serial Mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
