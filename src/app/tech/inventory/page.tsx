'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Search, 
  Filter, 
  Box, 
  Zap, 
  RotateCcw, 
  History, 
  AlertTriangle, 
  RefreshCw,
  Plus,
  ChevronRight,
  X,
  Loader2
} from 'lucide-react';
import VendorRmaManagement from '@/components/VendorRmaManagement';
import { useToast } from '@/components/ui';

// --- Types ---
type ItemType = 'CONSUMABLE' | 'ASSET' | 'TOOL';

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  type: ItemType;
  quantity: number;
  unit: string;
  minStock: number;
  maxStock: number;
  status: 'GOOD' | 'LOW' | 'OUT_OF_STOCK';
}

interface RequestItem {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'COMPLETED';
  isUrgent: boolean;
  items: string;
  date: string;
}

interface ReturnItem {
  id: string;
  status: 'RESOLVED' | 'PENDING';
  item: string;
  date: string;
}

// --- Modals ---
type RequestStockModalProps = {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  onSuccess: (newReq: RequestItem) => void;
};

const RequestStockModal: React.FC<RequestStockModalProps> = ({ isOpen, onClose, items, onSuccess }) => {
  const { addToast } = useToast();
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!selectedItemId) {
      addToast('error', 'Vui lòng chọn linh kiện / vật tư cần yêu cầu');
      return;
    }
    setLoading(true);
    try {
      const selectedItem = items.find(i => i.id === selectedItemId);
      const res = await fetch('/api/admin/inventory/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: selectedItemId,
          type: 'TRANSACTION_TYPE_IN',
          quantity: String(quantity),
          unitCost: '0',
          reason: notes || 'Yêu cầu cấp phát vật tư kỹ thuật viên',
        }),
      });

      if (!res.ok) {
        throw new Error('Yêu cầu cấp phát thất bại');
      }

      addToast('success', `Đã gửi yêu cầu cấp phát ${quantity}x ${selectedItem?.name || 'vật tư'}`);
      onSuccess({
        id: `REQ-${Date.now().toString().slice(-4)}`,
        status: 'PENDING',
        isUrgent: notes.toLowerCase().includes('khẩn') || notes.toLowerCase().includes('urgent'),
        items: `${quantity}x ${selectedItem?.name || 'Linh kiện'}`,
        date: 'Vừa xong',
      });
      onClose();
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Có lỗi khi gửi yêu cầu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="text-lg font-bold text-gray-900">Yêu cầu cấp vật tư (Restock Request)</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700">Chọn linh kiện / vật tư</label>
            <select 
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
            >
              <option value="">-- Chọn linh kiện --</option>
              {items.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.sku}) - Hiện còn: {item.quantity} {item.unit}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700">Số lượng cần</label>
            <input 
              type="number" 
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
              min={1}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700">Ghi chú / Mức độ khẩn</label>
            <textarea 
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Cần gấp cho Ticket #123 sáng mai..."
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
            />
          </div>
        </div>

        <div className="p-6 bg-gray-50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Hủy
          </button>
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Gửi yêu cầu
          </button>
        </div>
      </div>
    </div>
  );
};

type CreateRMAModalProps = {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  onSuccess: (newRma: ReturnItem) => void;
};

const CreateRMAModal: React.FC<CreateRMAModalProps> = ({ isOpen, onClose, items, onSuccess }) => {
  const { addToast } = useToast();
  const [selectedItemId, setSelectedItemId] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [defectDescription, setDefectDescription] = useState('');
  const [vendorName, setVendorName] = useState('Default Vendor');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!selectedItemId) {
      addToast('error', 'Vui lòng chọn linh kiện cần gửi trả RMA');
      return;
    }
    if (!serialNumber.trim()) {
      addToast('error', 'Vui lòng nhập Serial Number của thiết bị lỗi');
      return;
    }
    if (!defectDescription.trim()) {
      addToast('error', 'Vui lòng mô tả lỗi hỏng hóc');
      return;
    }

    setLoading(true);
    try {
      const selectedItem = items.find(i => i.id === selectedItemId);
      const res = await fetch('/api/admin/inventory/rma', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: selectedItemId,
          originalSerialNumber: serialNumber.trim(),
          defectDescription: defectDescription.trim(),
          vendorName: vendorName.trim() || 'Nhà cung cấp',
        }),
      });

      if (!res.ok) {
        throw new Error('Tạo phiếu RMA thất bại');
      }

      addToast('success', `Đã tạo yêu cầu RMA cho ${selectedItem?.name || 'thiết bị'}`);
      onSuccess({
        id: `RMA-${Date.now().toString().slice(-4)}`,
        status: 'PENDING',
        item: `${selectedItem?.name || 'Thiết bị'} (SN: ${serialNumber.trim()}) - ${defectDescription.trim()}`,
        date: 'Vừa tạo',
      });
      onClose();
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Có lỗi khi tạo phiếu RMA');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="text-lg font-bold text-gray-900">Tạo phiếu trả bảo hành (RMA Ticket)</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pt-6">
          <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0" />
            <p className="text-xs text-orange-800 leading-snug">
              Đảm bảo thiết bị lỗi có Serial Number hợp lệ và đã được thu hồi thực tế từ khách hàng/hiện trường.
            </p>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700">Linh kiện / Thiết bị</label>
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all appearance-none"
            >
              <option value="">-- Chọn linh kiện --</option>
              {items.map(item => (
                <option key={item.id} value={item.id}>{item.name} ({item.sku})</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700">Serial Number (SN)</label>
            <input 
              type="text" 
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              placeholder="Nhập hoặc quét mã SN..."
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700">Nhà cung cấp / Đối tác</label>
            <input 
              type="text" 
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              placeholder="VD: Viễn Sơn, FPT Synnex, Mai Hoàng..."
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700">Mô tả chi tiết lỗi hỏng</label>
            <textarea 
              rows={3}
              value={defectDescription}
              onChange={(e) => setDefectDescription(e.target.value)}
              placeholder="Mô tả hiện tượng lỗi (VD: không lên nguồn, sọc màn hình, bad sector...)"
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none"
            />
          </div>
        </div>

        <div className="p-6 bg-gray-50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Hủy
          </button>
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors shadow-sm flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Tạo phiếu RMA
          </button>
        </div>
      </div>
    </div>
  );
};

export default function MyInventoryPage() {
  const [activeTab, setActiveTab] = useState<'ALL' | 'RESTOCK' | 'RETURNS' | 'RMA'>('ALL');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [returns, setReturns] = useState<ReturnItem[]>([]);
  const [loadingReturns, setLoadingReturns] = useState(false);

  // Modals
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isRmaModalOpen, setIsRmaModalOpen] = useState(false);

  // Load real items from API
  const loadItems = useCallback(async () => {
    setLoadingItems(true);
    try {
      const res = await fetch('/api/admin/inventory/items?pageSize=100');
      if (res.ok) {
        const data = await res.json();
        const list = data.items || [];
        setItems(list.map((it: Record<string, unknown>) => {
          const qty = Number(it.availableQuantity ?? it.totalQuantity ?? 0);
          const minStock = Number(it.minStockLevel || 0);
          const status: 'GOOD' | 'LOW' | 'OUT_OF_STOCK' =
            qty <= 0 ? 'OUT_OF_STOCK' : qty <= minStock ? 'LOW' : 'GOOD';
          const type: ItemType =
            Number(it.itemType) === 1 ? 'CONSUMABLE' : Number(it.itemType) === 2 ? 'ASSET' : 'TOOL';
          return {
            id: String(it.id || ''),
            name: String(it.name || ''),
            sku: String(it.skuCode || it.sku || ''),
            type,
            quantity: qty,
            unit: String(it.unit || 'pcs'),
            minStock,
            maxStock: Number(it.maxStockLevel || 50),
            status,
          };
        }));
      }
    } catch (err) {
      console.error('[tech/inventory] Error loading items:', err);
    } finally {
      setLoadingItems(false);
    }
  }, []);

  // Load real returns/RMAs from API
  const loadReturns = useCallback(async () => {
    setLoadingReturns(true);
    try {
      const res = await fetch('/api/admin/inventory/rma');
      if (res.ok) {
        const data = await res.json();
        const list = data.rmas || [];
        setReturns(list.map((r: Record<string, unknown>) => ({
          id: String(r.rmaNumber || r.id || 'RMA'),
          status: String(r.status).toUpperCase() === 'COMPLETED' ? 'RESOLVED' : 'PENDING',
          item: `${String(r.defectDescription || 'Linh kiện lỗi')} (SN: ${String(r.originalSerialNumber || 'N/A')})`,
          date: r.createdAt ? new Date(String(r.createdAt)).toLocaleDateString('vi-VN') : 'Mới tạo',
        })));
      }
    } catch (err) {
      console.error('[tech/inventory] Error loading returns:', err);
    } finally {
      setLoadingReturns(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
    loadReturns();
  }, [loadItems, loadReturns]);

  // Dynamic metrics calculation
  const totalItemsCount = items.length;
  const assetsCount = useMemo(() => items.filter(i => i.type === 'ASSET').length, [items]);
  const lowStockCount = useMemo(() => items.filter(i => i.status === 'LOW' || i.status === 'OUT_OF_STOCK').length, [items]);

  // Filtered items
  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return items;
    return items.filter(item => 
      item.name.toLowerCase().includes(q) || 
      item.sku.toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  // Helpers
  const getTypeBadgeStyle = (type: ItemType) => {
    return type === 'CONSUMABLE' 
      ? 'bg-blue-50 text-blue-600' 
      : 'bg-purple-50 text-purple-600';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'GOOD': return 'bg-green-500';
      case 'LOW': return 'bg-red-500';
      case 'OUT_OF_STOCK': return 'bg-red-500';
      default: return 'bg-gray-300';
    }
  };

  const getRequestStatusStyle = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-100 text-amber-700';
      case 'APPROVED': return 'bg-blue-100 text-blue-700';
      case 'COMPLETED': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const calculateProgress = (current: number, max: number) => {
    if (!max || max <= 0) return 0;
    return Math.min((current / max) * 100, 100);
  };

  const renderAllItems = () => (
    <>
      {/* SEARCH BAR */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm vật tư theo tên, mã SKU..." 
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
          />
        </div>
        <button 
          onClick={loadItems}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium shadow-sm hover:bg-gray-50 transition-colors whitespace-nowrap"
        >
          <RefreshCw className={`w-4 h-4 ${loadingItems ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* INVENTORY GRID */}
      {loadingItems ? (
        <div className="flex flex-col items-center justify-center p-16 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
          <p className="text-sm">Đang tải kho linh kiện từ server...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-gray-100 text-gray-400">
          <Box className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-semibold text-gray-600">Không tìm thấy linh kiện nào</p>
          <p className="text-xs text-gray-400 mt-1">Thử đổi từ khóa tìm kiếm hoặc bấm Làm mới.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <div 
              key={item.id} 
              className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 hover:-translate-y-1 transition-all duration-300 group relative flex flex-col"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  item.type === 'CONSUMABLE' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                }`}>
                  {item.type === 'CONSUMABLE' ? <Box className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide ${getTypeBadgeStyle(item.type)}`}>
                  {item.type}
                </span>
              </div>

              <div className="mb-6 flex-1">
                <h3 className="font-bold text-gray-900 line-clamp-1 mb-1 group-hover:text-blue-600 transition-colors">{item.name}</h3>
                <p className="text-xs text-gray-400 font-mono tracking-wide">{item.sku}</p>
              </div>

              <div className="mt-auto">
                 <div className="flex justify-between items-end mb-2">
                   <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Số lượng</p>
                      <div className="flex items-baseline gap-1">
                         <span className={`text-xl font-bold ${item.status === 'OUT_OF_STOCK' ? 'text-red-500' : 'text-gray-900'}`}>
                            {item.quantity}
                         </span>
                         <span className="text-xs text-gray-500 font-medium">{item.unit}</span>
                      </div>
                   </div>
                   {(item.status === 'LOW' || item.status === 'OUT_OF_STOCK') && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded-md border border-red-100 animate-pulse">
                         <AlertTriangle className="w-3 h-3" />
                         Cần nhập
                      </span>
                   )}
                 </div>

                 <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${getStatusColor(item.status)}`}
                      style={{ width: `${calculateProgress(item.quantity, item.maxStock)}%` }}
                    />
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );

  const renderRestock = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
          <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Yêu cầu cấp phát vật tư</h3>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Sắp hết linh kiện hoặc cần vật tư cho công việc bảo trì sắp tới? Gửi yêu cầu để kho trung tâm xuất hàng.
          </p>
          <button 
            onClick={() => setIsRequestModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-5 h-5" />
            Tạo yêu cầu mới
          </button>
        </div>

        <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
          <div className="flex items-center gap-2 mb-4 text-blue-800">
            <Zap className="w-4 h-4" />
            <h4 className="font-bold text-sm">Vật tư dùng nhiều trong tháng</h4>
          </div>
          <ul className="space-y-3">
            {items.slice(0, 3).map((it) => (
              <li key={it.id} className="flex items-center justify-between text-sm text-blue-700">
                <span className="truncate">{it.name}</span>
                <span className="font-semibold text-xs bg-blue-100 px-2 py-0.5 rounded">{it.quantity} {it.unit}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-900">Lịch sử yêu cầu gần đây</h3>
        </div>

        {requests.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-gray-100 text-center text-gray-400">
            <p className="text-sm">Chưa có yêu cầu cấp phát nào trong phiên làm việc.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <div key={req.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-bold text-gray-900">{req.id}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${getRequestStatusStyle(req.status)}`}>
                        {req.status}
                      </span>
                      {req.isUrgent && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-red-50 text-red-600 border border-red-100">
                          <AlertTriangle className="w-3 h-3" />
                          Khẩn cấp
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{req.items}</p>
                  </div>
                  
                  <div className="flex items-center justify-between md:justify-end gap-6 min-w-[140px]">
                    <span className="text-xs text-gray-400 font-medium">{req.date}</span>
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderReturns = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <History className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Quy trình trả hàng & Bảo hành (RMA)</h3>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Phát hiện linh kiện/thiết bị lỗi thu hồi từ khách? Tạo phiếu RMA để chuyển lại kho hoặc nhà cung cấp.
          </p>
          <button 
            onClick={() => setIsRmaModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-amber-600/20"
          >
            <Plus className="w-5 h-5" />
            Tạo phiếu RMA
          </button>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-900">Lịch sử thiết bị bảo hành (RMA)</h3>
          <button onClick={loadReturns} className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
            <RefreshCw className={`w-3 h-3 ${loadingReturns ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>

        {loadingReturns ? (
          <div className="bg-white p-8 rounded-xl border border-gray-100 text-center text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin text-amber-500 mx-auto mb-2" />
            <p className="text-sm">Đang tải lịch sử RMA từ hệ thống...</p>
          </div>
        ) : returns.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-gray-100 text-center text-gray-400">
            <p className="text-sm">Chưa có phiếu bảo hành RMA nào.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {returns.map((rma) => (
              <div key={rma.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-bold text-gray-900">{rma.id}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                        rma.status === 'RESOLVED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {rma.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{rma.item}</p>
                    <p className="text-xs text-gray-400">{rma.date}</p>
                  </div>
                  
                  <div className="flex items-center justify-end">
                     <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                       <RefreshCw className="w-4 h-4" />
                     </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kho Linh Kiện Kỹ Thuật Viên</h1>
            <p className="text-gray-500 mt-1">Quản lý định mức vật tư, tạo yêu cầu xuất kho và theo dõi bảo hành RMA</p>
          </div>
          
          <div className="flex items-center gap-1 bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm">
            <button 
              onClick={() => setActiveTab('ALL')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'ALL' 
                  ? 'bg-gray-900 text-white shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Box className="w-4 h-4" />
              Tất cả vật tư ({totalItemsCount})
            </button>
            <button 
              onClick={() => setActiveTab('RESTOCK')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'RESTOCK' 
                  ? 'bg-gray-900 text-white shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              Yêu cầu cấp phát
            </button>
            <button 
              onClick={() => setActiveTab('RETURNS')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'RETURNS' 
                  ? 'bg-gray-900 text-white shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <History className="w-4 h-4" />
              Trả hàng RMA ({returns.length})
            </button>
            <button 
              onClick={() => setActiveTab('RMA')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'RMA' 
                  ? 'bg-gray-900 text-white shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              Vendor RMA (SRS III.8)
            </button>
          </div>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Tổng mã vật tư</p>
                <h2 className="text-3xl font-bold text-gray-900">{totalItemsCount}</h2>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                <Box className="w-5 h-5" />
              </div>
            </div>
            <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
               <div className="h-full bg-blue-500 w-[75%] rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Tài sản cố định (Assets)</p>
                <h2 className="text-3xl font-bold text-gray-900 flex items-baseline gap-1">
                  {assetsCount} <span className="text-sm font-medium text-gray-500">mã thiết bị</span>
                </h2>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                <Zap className="w-5 h-5" />
              </div>
            </div>
            <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
               <div className="h-full bg-purple-500 w-[45%] rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
            </div>
          </div>

          <div className="bg-red-50 p-6 rounded-2xl shadow-sm border border-red-100 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-1">Cảnh báo sắp hết hàng</p>
                <h2 className="text-3xl font-bold text-red-900 flex items-baseline gap-1">
                  {lowStockCount} <span className="text-sm font-medium text-red-500">mã</span>
                </h2>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-red-500 shadow-sm group-hover:scale-110 transition-transform">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <div className="h-1 w-full bg-red-200 rounded-full overflow-hidden">
               <div className="h-full bg-red-500 w-[60%] rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
            </div>
          </div>
        </div>

        {/* DYNAMIC CONTENT */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          {activeTab === 'ALL' && renderAllItems()}
          {activeTab === 'RESTOCK' && renderRestock()}
          {activeTab === 'RETURNS' && renderReturns()}
          {activeTab === 'RMA' && <VendorRmaManagement />}
        </div>
      </div>
      
      {/* MODALS */}
      <RequestStockModal 
        isOpen={isRequestModalOpen} 
        onClose={() => setIsRequestModalOpen(false)} 
        items={items}
        onSuccess={(newReq) => setRequests(prev => [newReq, ...prev])}
      />
      <CreateRMAModal 
        isOpen={isRmaModalOpen} 
        onClose={() => setIsRmaModalOpen(false)} 
        items={items}
        onSuccess={(newRma) => setReturns(prev => [newRma, ...prev])}
      />
    </div>
  );
}
