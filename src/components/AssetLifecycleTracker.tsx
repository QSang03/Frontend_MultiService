'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  Search,
  Wrench,
  Clock,
  DollarSign,
  QrCode,
  ShieldCheck,
  Calendar,
  Building,
  RefreshCw,
  AlertCircle,
  FileText,
  Tag,
} from 'lucide-react';
import internalApiClient from '@/lib/api/internal-client';

interface AssetDetail {
  id: string;
  name: string;
  description?: string;
  serialNumber?: string;
  model?: string;
  manufacturer?: string;
  location?: string;
  status: string;
  warrantyExpiry?: string;
  createdAt?: string;
}

interface AssetTCO {
  totalCostCents: number;
  repairCount: number;
  costByCategory: Record<string, number>;
  lastRepairedAt?: string;
}

interface RepairRecord {
  id: string;
  assetId: string;
  ticketId: string;
  technicianId?: string;
  description: string;
  repairCostCents: number;
  partsCostCents: number;
  componentCategory: string;
  repairedAt?: string;
}

const formatVnd = (cents: number): string => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(cents);
};

export default function AssetLifecycleTracker() {
  const [searchQuery, setSearchQuery] = useState('');
  const [assets, setAssets] = useState<AssetDetail[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<AssetDetail | null>(null);
  const [tco, setTco] = useState<AssetTCO | null>(null);
  const [repairHistory, setRepairHistory] = useState<RepairRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial asset list
  const loadAssets = useCallback(async (query = '') => {
    setIsSearching(true);
    try {
      const res = await internalApiClient.get<{ assets: AssetDetail[] }>('/api/admin/assets', {
        params: { search: query },
      });
      const list = res.data?.assets || [];
      setAssets(list);
      if (list.length > 0 && !selectedAsset) {
        selectAsset(list[0].id);
      }
    } catch {
      // Fallback
    } finally {
      setIsSearching(false);
    }
  }, []);

  const selectAsset = async (assetId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await internalApiClient.get<{
        asset: AssetDetail;
        tco: AssetTCO;
        repairHistory: RepairRecord[];
      }>('/api/admin/assets', {
        params: { assetId },
      });
      if (res.data) {
        setSelectedAsset(res.data.asset);
        setTco(res.data.tco);
        setRepairHistory(res.data.repairHistory || []);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể tải thông tin thiết bị');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadAssets(searchQuery);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6 shadow-sm">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Theo Dõi Vòng Đời &amp; Tổng Chi Phí Sở Hữu (Asset TCO &amp; Lifecycle)
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Quản trị thiết bị theo chuẩn SRS III.6: Tự động ghi nhận từ Ticket, tính TCO và cảnh báo bảo trì định kỳ.
          </p>
        </div>
        <button
          onClick={() => loadAssets(searchQuery)}
          disabled={isLoading || isSearching}
          className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          title="Tải lại"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading || isSearching ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo Serial Number, Model, Tên thiết bị hoặc mã QR..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm transition-colors"
        >
          <QrCode className="w-4 h-4" />
          Tra cứu
        </button>
      </form>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Asset Selection Pills if multiple */}
      {assets.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="font-semibold text-gray-500 flex-shrink-0">Thiết bị:</span>
          {assets.map((a) => (
            <button
              key={a.id}
              onClick={() => selectAsset(a.id)}
              className={`px-3 py-1.5 rounded-full font-mono transition-colors flex-shrink-0 ${
                selectedAsset?.id === a.id
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {a.model || a.name} {a.serialNumber ? `(${a.serialNumber})` : ''}
            </button>
          ))}
        </div>
      )}

      {/* Selected Asset Content */}
      {selectedAsset ? (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-xl p-5 border border-gray-200">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-gray-900">{selectedAsset.name}</h3>
                  <span className="px-2.5 py-0.5 bg-green-100 text-green-800 text-xs font-bold rounded-full uppercase">
                    {selectedAsset.status}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-600 font-mono">
                  {selectedAsset.serialNumber && (
                    <span>
                      S/N: <strong>{selectedAsset.serialNumber}</strong>
                    </span>
                  )}
                  {selectedAsset.model && <span>Model: {selectedAsset.model}</span>}
                  {selectedAsset.manufacturer && <span>Hãng: {selectedAsset.manufacturer}</span>}
                  {selectedAsset.location && <span>Vị trí: {selectedAsset.location}</span>}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs bg-white border border-gray-200 rounded-lg px-3 py-1.5 font-mono text-gray-600 flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-blue-600" />
                  Mã tài sản: {selectedAsset.id.slice(0, 8)}
                </span>
              </div>
            </div>

            {/* KPI Cards: TCO & Maintenance */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
              <div className="bg-white rounded-lg p-3.5 border border-gray-200 shadow-sm">
                <p className="text-xs text-gray-500 font-semibold uppercase">Tổng Chi Phí Sở Hữu (TCO)</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {formatVnd(tco?.totalCostCents || 0)}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">Bao gồm công sửa chữa &amp; linh kiện</p>
              </div>

              <div className="bg-white rounded-lg p-3.5 border border-gray-200 shadow-sm">
                <p className="text-xs text-gray-500 font-semibold uppercase">Số Lần Bảo Trì / Sửa Chữa</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {tco?.repairCount || repairHistory.length} <span className="text-sm font-normal text-gray-500">lần</span>
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Lần gần nhất: {tco?.lastRepairedAt ? new Date(tco.lastRepairedAt).toLocaleDateString('vi-VN') : 'Mới'}
                </p>
              </div>

              <div className="bg-white rounded-lg p-3.5 border border-blue-200 bg-blue-50/50 shadow-sm">
                <p className="text-xs text-blue-700 font-semibold uppercase">Bảo Trì Dự Phòng (Preventive)</p>
                <p className="text-lg font-bold text-blue-900 mt-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  Chu kỳ 180 ngày
                </p>
                <p className="text-[11px] text-blue-700 mt-0.5">Tự động gửi cảnh báo định kỳ</p>
              </div>
            </div>
          </div>

          {/* Breakdown by Category */}
          {tco?.costByCategory && Object.keys(tco.costByCategory).length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Phân Bổ Chi Phí Theo Cụm Linh Kiện</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {Object.entries(tco.costByCategory).map(([cat, cost]) => (
                  <div key={cat} className="p-2.5 bg-gray-50 rounded-lg border text-xs">
                    <span className="text-gray-500 block capitalize">{cat.replace('_', ' ')}</span>
                    <span className="font-bold font-mono text-gray-900">{formatVnd(cost)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline of Repairs */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              Lịch Sử Sửa Chữa &amp; Can Thiệp Kỹ Thuật (Audit Trail)
            </h4>

            {repairHistory.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-400 border border-dashed rounded-xl">
                Chưa có dữ liệu sửa chữa ghi nhận cho thiết bị này.
              </div>
            ) : (
              <div className="relative border-l-2 border-blue-200 ml-4 space-y-4 py-2">
                {repairHistory.map((item, idx) => (
                  <div key={item.id || idx} className="relative pl-6">
                    <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow" />
                    <div className="p-3.5 bg-gray-50 hover:bg-gray-100/80 rounded-xl border border-gray-200 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-sm text-gray-900">{item.description}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            <span>
                              {item.repairedAt ? new Date(item.repairedAt).toLocaleDateString('vi-VN') : 'Vừa xong'}
                            </span>
                            <span>•</span>
                            <span className="capitalize">Hạng mục: {item.componentCategory}</span>
                            {item.ticketId && (
                              <>
                                <span>•</span>
                                <span className="font-mono text-blue-600">Ticket: {item.ticketId.slice(0, 8)}...</span>
                              </>
                            )}
                          </div>
                        </div>
                        <span className="text-xs font-bold font-mono text-red-600">
                          +{formatVnd(item.repairCostCents + item.partsCostCents)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          <Activity className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">Nhập Serial Number hoặc tên thiết bị để tra cứu vòng đời.</p>
        </div>
      )}
    </div>
  );
}
