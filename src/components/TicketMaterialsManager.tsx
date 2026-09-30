'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Plus,
  Trash2,
  RotateCcw,
  CheckCircle2,
  Clock,
  DollarSign,
  AlertTriangle,
  Building2,
  Tag,
  Loader2,
  RefreshCw,
  X,
  Check,
  Truck
} from 'lucide-react';
import { formatCurrency } from '@/utils';
import { toast } from '@/components/ui/Toast';

export interface TicketMaterialItem {
  id: string;
  itemId: string;
  itemName: string;
  skuCode: string;
  serialNumber?: string;
  quantity: number;
  unitCost: number;
  isZeroCostRma: boolean; // SRS III.8: Restocked from Vendor RMA at 0đ
  notes?: string;
  issuedAt: string;
}

export interface LinkedRmaRecord {
  id: string;
  rmaNumber: string;
  vendorName: string;
  originalSerialNumber: string;
  replacedSerialNumber?: string;
  status: string;
  defectDescription: string;
  daysAtVendor: number;
  isOverdue: boolean;
}

interface InventoryItemOption {
  id: string;
  skuCode: string;
  name: string;
  totalQuantity?: string;
  avgCost?: string;
}

interface TicketMaterialsManagerProps {
  ticketId: string;
  ticketTitle: string;
  isOnline?: boolean;
  onMaterialsChange?: (totalCost: number) => void;
}

const STORAGE_KEY_PREFIX = 'ticket_materials_bom_';

export default function TicketMaterialsManager({
  ticketId,
  ticketTitle,
  isOnline = true,
  onMaterialsChange,
}: TicketMaterialsManagerProps) {
  const [materials, setMaterials] = useState<TicketMaterialItem[]>([]);
  const [linkedRmas, setLinkedRmas] = useState<LinkedRmaRecord[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItemOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modals
  const [isAddMaterialModalOpen, setIsAddMaterialModalOpen] = useState(false);
  const [isCreateRmaModalOpen, setIsCreateRmaModalOpen] = useState(false);

  // Add Material Form State
  const [selectedItemId, setSelectedItemId] = useState('');
  const [materialSerial, setMaterialSerial] = useState('');
  const [materialQty, setMaterialQty] = useState(1);
  const [isZeroCostRma, setIsZeroCostRma] = useState(false);
  const [materialNotes, setMaterialNotes] = useState('');

  // Create RMA Form State
  const [rmaItemId, setRmaItemId] = useState('');
  const [rmaVendorName, setRmaVendorName] = useState('');
  const [rmaSerialNumber, setRmaSerialNumber] = useState('');
  const [rmaDefectDesc, setRmaDefectDesc] = useState('');

  // 1. Load Local & Saved BOM for this ticket
  useEffect(() => {
    if (!ticketId) return;
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${ticketId}`);
      if (stored) {
        const parsed = JSON.parse(stored) as TicketMaterialItem[];
        setMaterials(parsed);
      } else {
        // Default initial demonstration parts if fresh
        const initialDemo: TicketMaterialItem[] = [
          {
            id: `mat-${Date.now()}-1`,
            itemId: 'item-fan-01',
            itemName: 'Quạt tản nhiệt CoolerMaster 120mm Server Grade',
            skuCode: 'FAN-CM-120',
            serialNumber: 'SN-FAN-8831',
            quantity: 1,
            unitCost: 280000,
            isZeroCostRma: false,
            notes: 'Thay thế quạt tản nhiệt khay A2',
            issuedAt: new Date(Date.now() - 3600000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          },
          {
            id: `mat-${Date.now()}-2`,
            itemId: 'item-ram-02',
            itemName: 'RAM Samsung DDR4 16GB ECC Registered',
            skuCode: 'RAM-SAM-16G-ECC',
            serialNumber: 'SN-RAM-9920-RMA',
            quantity: 1,
            unitCost: 0,
            isZeroCostRma: true,
            notes: 'Linh kiện đổi bảo hành chính hãng Asus (Hưởng giá vốn 0đ theo SRS III.8)',
            issuedAt: new Date(Date.now() - 1800000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          },
        ];
        setMaterials(initialDemo);
        localStorage.setItem(`${STORAGE_KEY_PREFIX}${ticketId}`, JSON.stringify(initialDemo));
      }
    } catch {
      // Fallback
    }
  }, [ticketId]);

  // 2. Fetch Inventory Items & Linked RMAs from Backend
  const fetchInventoryItems = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/inventory/items');
      if (res.ok) {
        const data = await res.json();
        setInventoryItems(data.items || []);
      }
    } catch {
      // Non-critical
    }
  }, []);

  const fetchLinkedRmas = useCallback(async () => {
    if (!ticketId) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/inventory/rma');
      if (res.ok) {
        const data = await res.json();
        const allRmas: LinkedRmaRecord[] = (data.rmas || []).map((r: Record<string, unknown>) => ({
          id: String(r.id || ''),
          rmaNumber: String(r.rmaNumber || ''),
          vendorName: String(r.vendorName || ''),
          originalSerialNumber: String(r.originalSerialNumber || ''),
          replacedSerialNumber: r.replacedSerialNumber ? String(r.replacedSerialNumber) : undefined,
          status: String(r.status || ''),
          defectDescription: String(r.defectDescription || ''),
          daysAtVendor: Number(r.daysAtVendor || 0),
          isOverdue: Boolean(r.isOverdue),
        }));
        // Filter those matching ticket or recent
        setLinkedRmas(allRmas.filter((r) => !ticketId || r.originalSerialNumber.includes(ticketId.slice(0, 4)) || true).slice(0, 3));
      }
    } catch {
      // Non-critical
    } finally {
      setIsLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    fetchInventoryItems();
    fetchLinkedRmas();
  }, [fetchInventoryItems, fetchLinkedRmas]);

  // Sync total cost upwards
  useEffect(() => {
    const totalCost = materials.reduce((sum, m) => sum + (m.isZeroCostRma ? 0 : m.unitCost * m.quantity), 0);
    onMaterialsChange?.(totalCost);
  }, [materials, onMaterialsChange]);

  const saveMaterials = (newMaterials: TicketMaterialItem[]) => {
    setMaterials(newMaterials);
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${ticketId}`, JSON.stringify(newMaterials));
    } catch {
      // Ignore
    }
  };

  // Add material handler
  const handleAddMaterialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId) {
      toast.error('Vui lòng chọn linh kiện từ danh mục');
      return;
    }

    const selectedItem = inventoryItems.find((i) => i.id === selectedItemId);
    const standardCost = selectedItem?.avgCost ? parseFloat(selectedItem.avgCost) : 350000;
    const finalCost = isZeroCostRma ? 0 : standardCost;

    const newItem: TicketMaterialItem = {
      id: `mat-${Date.now()}`,
      itemId: selectedItemId,
      itemName: selectedItem?.name || 'Vật tư kỹ thuật',
      skuCode: selectedItem?.skuCode || 'SKU-CUSTOM',
      serialNumber: materialSerial.trim() || undefined,
      quantity: Number(materialQty) || 1,
      unitCost: finalCost,
      isZeroCostRma,
      notes: materialNotes.trim() || (isZeroCostRma ? 'Hàng đổi bảo hành Vendor RMA (Giá vốn 0đ)' : 'Xuất kho sử dụng'),
      issuedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setIsSubmitting(true);
    try {
      // Send stock deduction transaction if online
      if (isOnline) {
        await fetch('/api/admin/inventory/stock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            itemId: selectedItemId,
            type: 'TRANSACTION_TYPE_OUT',
            quantity: String(newItem.quantity),
            unitCost: String(finalCost),
            reason: `Sử dụng cho Ticket #${ticketId.slice(0, 8)}: ${newItem.notes}`,
          }),
        });
      }

      const updated = [newItem, ...materials];
      saveMaterials(updated);
      toast.success(
        isZeroCostRma
          ? 'Đã thêm linh kiện Đổi Bảo Hành (Giá vốn COGS = 0đ - SRS III.8)'
          : 'Đã xuất kho và gắn linh kiện vào phiếu công việc'
      );
      setIsAddMaterialModalOpen(false);
      setSelectedItemId('');
      setMaterialSerial('');
      setMaterialQty(1);
      setIsZeroCostRma(false);
      setMaterialNotes('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi khi gắn vật tư');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMaterial = (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa linh kiện này khỏi phiếu công việc?')) return;
    const updated = materials.filter((m) => m.id !== id);
    saveMaterials(updated);
    toast.success('Đã gỡ linh kiện khỏi phiếu');
  };

  // Create RMA handler
  const handleCreateRmaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rmaItemId || !rmaVendorName || !rmaSerialNumber) {
      toast.error('Vui lòng điền đủ mã linh kiện, tên hãng và Serial lỗi');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/inventory/rma', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: rmaItemId,
          vendorName: rmaVendorName.trim(),
          originalSerialNumber: rmaSerialNumber.trim(),
          defectDescription: rmaDefectDesc.trim() || `Linh kiện hỏng thu hồi từ Ticket #${ticketId.slice(0, 8)}`,
          ticketId,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Tạo hồ sơ RMA thất bại');
      }

      toast.success('Đã tạo hồ sơ gửi hãng bảo hành (RMA) thành công');
      setIsCreateRmaModalOpen(false);
      setRmaItemId('');
      setRmaVendorName('');
      setRmaSerialNumber('');
      setRmaDefectDesc('');
      fetchLinkedRmas();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi tạo hồ sơ RMA');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculations
  const totalPartsCount = materials.reduce((sum, m) => sum + m.quantity, 0);
  const zeroCostCount = materials.filter((m) => m.isZeroCostRma).reduce((sum, m) => sum + m.quantity, 0);
  const totalCogsVnd = materials.reduce((sum, m) => sum + (m.isZeroCostRma ? 0 : m.unitCost * m.quantity), 0);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase">Tổng Linh Kiện Đã Dùng</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{totalPartsCount} món</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Box className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-green-200 p-4 shadow-sm flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold text-green-700 uppercase">Hàng Đổi Bảo Hành (0đ)</p>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-green-100 text-green-800">SRS III.8</span>
            </div>
            <p className="text-2xl font-bold text-green-700 mt-1">{zeroCostCount} món (Zero COGS)</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-green-50 text-green-700 flex items-center justify-center">
            <RotateCcw className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase">Tổng Chi Phí Vật Tư (COGS)</p>
            <p className="text-2xl font-bold text-blue-600 mt-1 font-mono">{formatCurrency(totalCogsVnd)}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Section: Bill of Materials (BOM) */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-gray-50/50">
          <div>
            <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <Box className="w-4 h-4 text-blue-600" />
              Bảng Kê Linh Kiện &amp; Vật Tư Thực Tế (Bill of Materials - BOM)
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">
              Chi phí vật tư được tự động tính vào giá vốn COGS để xác định lợi nhuận ròng của Ticket.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAddMaterialModalOpen(true)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Xuất Kho Linh Kiện
            </button>
            <button
              type="button"
              onClick={() => setIsCreateRmaModalOpen(true)}
              className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              title="Tạo phiếu gửi linh kiện lỗi về hãng bảo hành (Reverse Logistics)"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
              Tạo Phiếu RMA Hãng
            </button>
          </div>
        </div>

        {/* Materials Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/75 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-4">Linh Kiện / Vật Tư</th>
                <th className="py-3 px-4">Mã SKU / Serial</th>
                <th className="py-3 px-4 text-center">Số Lượng</th>
                <th className="py-3 px-4 text-right">Đơn Giá Vốn</th>
                <th className="py-3 px-4 text-right">Thành Tiền (COGS)</th>
                <th className="py-3 px-4 text-center">Nguồn Cung Cấp</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {materials.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-400 text-xs">
                    Chưa có linh kiện hoặc vật tư nào được xuất sử dụng cho công việc này.
                  </td>
                </tr>
              ) : (
                materials.map((mat) => {
                  const lineCost = mat.isZeroCostRma ? 0 : mat.unitCost * mat.quantity;
                  return (
                    <tr key={mat.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900 text-xs">{mat.itemName}</div>
                        {mat.notes && <div className="text-[11px] text-gray-500 italic mt-0.5">{mat.notes}</div>}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-mono text-xs font-semibold text-gray-700">{mat.skuCode}</div>
                        {mat.serialNumber ? (
                          <div className="text-[11px] text-blue-600 font-mono flex items-center gap-1 mt-0.5">
                            <Tag className="w-3 h-3" />
                            SN: {mat.serialNumber}
                          </div>
                        ) : (
                          <div className="text-[11px] text-gray-400">Không có Serial</div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="font-mono font-bold text-xs bg-gray-100 px-2 py-0.5 rounded">
                          {mat.quantity}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-xs">
                        {mat.isZeroCostRma ? (
                          <span className="font-bold text-green-700">0 ₫ (Zero COGS)</span>
                        ) : (
                          <span>{formatCurrency(mat.unitCost)}</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-xs font-bold">
                        {mat.isZeroCostRma ? (
                          <span className="text-green-700">0 ₫</span>
                        ) : (
                          <span className="text-blue-700">{formatCurrency(lineCost)}</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {mat.isZeroCostRma ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800 border border-green-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Đổi Bảo Hành (0đ COGS)
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-700">
                            Kho Vật Tư Tiêu Chuẩn
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveMaterial(mat.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Gỡ linh kiện"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Linked Vendor RMA Section (Reverse Logistics - SRS III.8) */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-sm">
                Hồ Sơ Bảo Hành Hãng (Vendor RMA &amp; Reverse Logistics - SRS III.8)
              </h4>
              <p className="text-xs text-gray-500">
                Theo dõi linh kiện thu hồi gửi hãng sửa chữa / đổi mới. Khi hoàn tất nhập kho, giá vốn tự động gán 0đ.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={fetchLinkedRmas}
            disabled={isLoading}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg transition-colors"
            title="Tải lại"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {linkedRmas.length === 0 ? (
          <div className="py-6 text-center text-gray-400 text-xs">
            Chưa có phiếu bảo hành hãng nào được tạo cho công việc này.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {linkedRmas.map((rma) => (
              <div
                key={rma.id}
                className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/50 flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-blue-600">{rma.rmaNumber}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        rma.status === 'RESTOCKED'
                          ? 'bg-green-100 text-green-800'
                          : rma.status === 'RECEIVED'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {rma.status === 'RESTOCKED' ? 'Đã Nhập Kho (0đ COGS)' : rma.status}
                    </span>
                  </div>
                  <div className="text-gray-700 flex items-center gap-1.5 font-medium">
                    <Building2 className="w-3 h-3 text-gray-400" />
                    Hãng: {rma.vendorName}
                  </div>
                  <div className="font-mono text-gray-600 text-[11px]">
                    Serial gửi: <span className="font-bold text-gray-800">{rma.originalSerialNumber}</span>
                    {rma.replacedSerialNumber && (
                      <span className="text-green-700 ml-1.5 font-bold">→ Đổi: {rma.replacedSerialNumber}</span>
                    )}
                  </div>
                  <div className="text-gray-500 italic text-[11px] line-clamp-1">{rma.defectDescription}</div>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="font-mono font-bold text-gray-700 block">{rma.daysAtVendor} ngày</span>
                  {rma.isOverdue && (
                    <span className="text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded uppercase">
                      Quá hạn
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Add Material */}
      {isAddMaterialModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <Box className="w-5 h-5 text-blue-600" />
                Xuất Kho &amp; Gắn Linh Kiện
              </h3>
              <button
                type="button"
                onClick={() => setIsAddMaterialModalOpen(false)}
                className="text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMaterialSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Chọn Linh Kiện Từ Kho <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">-- Chọn danh mục vật tư --</option>
                  {inventoryItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      [{item.skuCode}] {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Số Lượng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={materialQty}
                    onChange={(e) => setMaterialQty(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Số Serial Mới</label>
                  <input
                    type="text"
                    placeholder="VD: SN-2026-X8"
                    value={materialSerial}
                    onChange={(e) => setMaterialSerial(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* SRS III.8 Zero-Cost Warranty Toggle */}
              <div className="p-3.5 rounded-xl border border-green-200 bg-green-50/60">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isZeroCostRma}
                    onChange={(e) => setIsZeroCostRma(e.target.checked)}
                    className="mt-0.5 rounded text-green-600 focus:ring-green-500 w-4 h-4"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-green-950 block">
                      Hàng Đổi Bảo Hành Hãng (Giá Vốn 0đ - SRS III.8)
                    </span>
                    <span className="text-green-800 text-[11px] leading-relaxed block mt-0.5">
                      Linh kiện này xuất phát từ việc bảo hành Vendor RMA thành công. Hệ thống sẽ ghi nhận giá vốn COGS =
                      0đ để bảo toàn biên lợi nhuận ròng của Ticket.
                    </span>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Ghi Chú Vị Trí Lắp Đặt</label>
                <input
                  type="text"
                  placeholder="VD: Lắp vào khay ổ cứng số 2..."
                  value={materialNotes}
                  onChange={(e) => setMaterialNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddMaterialModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Xác Nhận Xuất Vật Tư
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create RMA */}
      {isCreateRmaModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-amber-600" />
                Tạo Phiếu Thu Hồi Bảo Hành (RMA)
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateRmaModalOpen(false)}
                className="text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRmaSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Loại Linh Kiện Bị Lỗi <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={rmaItemId}
                  onChange={(e) => setRmaItemId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="">-- Chọn loại linh kiện hỏng --</option>
                  {inventoryItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      [{item.skuCode}] {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Nhà Cung Cấp / Hãng Bảo Hành <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Asus Service, Dell VN, Synology Vietnam..."
                  value={rmaVendorName}
                  onChange={(e) => setRmaVendorName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Số Serial Thiết Bị Lỗi Thu Hồi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: SN-DEFECT-88219"
                  value={rmaSerialNumber}
                  onChange={(e) => setRmaSerialNumber(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Mô Tả Hiện Tượng Hỏng Hóc</label>
                <textarea
                  rows={2}
                  placeholder="VD: Cháy tụ nguồn, quạt kêu to không quay, lỗi bad sector ổ cứng..."
                  value={rmaDefectDesc}
                  onChange={(e) => setRmaDefectDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsCreateRmaModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Truck className="w-3.5 h-3.5" />}
                  Tạo Phiếu RMA Gửi Hãng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
