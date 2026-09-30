'use client';

import React, { useState } from 'react';
import { Search, QrCode, Laptop, Printer, Server, HardDrive, AlertTriangle, CheckCircle2, X, Loader2, ArrowRight, History } from 'lucide-react';

interface TechAssetLookupModalProps {
  isOpen: boolean;
  initialSerial?: string;
  onClose: () => void;
  onSelectAsset?: (serial: string, name: string) => void;
}

interface AssetDetails {
  id: string;
  name: string;
  description: string;
  serialNumber: string;
  model: string;
  manufacturer: string;
  location: string;
  status: string;
  warrantyExpiry?: string;
}

interface TcoData {
  totalCostCents: number;
  repairCount: number;
  lastRepairedAt?: string;
}

interface RepairRecord {
  id: string;
  ticketId: string;
  description: string;
  repairCostCents: number;
  partsCostCents: number;
  repairedAt?: string;
}

export default function TechAssetLookupModal({
  isOpen,
  initialSerial = '',
  onClose,
  onSelectAsset,
}: TechAssetLookupModalProps) {
  const [serialQuery, setSerialQuery] = useState(initialSerial);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [asset, setAsset] = useState<AssetDetails | null>(null);
  const [tco, setTco] = useState<TcoData | null>(null);
  const [history, setHistory] = useState<RepairRecord[]>([]);

  if (!isOpen) return null;

  const handleSearch = async (term?: string) => {
    const query = (term ?? serialQuery).trim();
    if (!query) {
      setErrorMsg('Vui lòng nhập số Serial hoặc quét mã QR thiết bị.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSearched(true);

    try {
      const res = await fetch(`/api/customer/b2b/assets?serial=${encodeURIComponent(query)}`);
      const data = await res.json();

      if (!res.ok || !data.asset) {
        setAsset(null);
        setTco(null);
        setHistory([]);
        setErrorMsg('Không tìm thấy thông tin tài sản với số serial này trên hệ thống.');
      } else {
        setAsset(data.asset);
        setTco(data.tco);
        setHistory(data.repairHistory || []);
      }
    } catch {
      setErrorMsg('Lỗi kết nối tra cứu dữ liệu tài sản.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number): string => {
    return (cents).toLocaleString('vi-VN') + ' đ';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <QrCode className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">Tra Cứu Tài Sản Tại Hiện Trường (QR / Serial)</h3>
              <p className="text-xs text-blue-100">
                SRS III.6 Asset Management Lite • Tra cứu TCO &amp; Lịch sử sửa chữa
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

        {/* Search Bar */}
        <div className="p-6 bg-gray-50/70 border-b border-gray-100 flex-shrink-0 space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSearch();
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={serialQuery}
                onChange={(e) => {
                  setSerialQuery(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="Nhập Serial Number thiết bị hoặc chuỗi từ mã QR (VD: PRN-CANON-2900)..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>Tra Cứu</span>
            </button>
          </form>

          {/* Quick Demo Badges */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-400 text-[11px]">Gợi ý nhanh:</span>
            {['PRN-CANON-2900', 'SRV-DELL-R740', 'LP-THINKPAD-T14'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setSerialQuery(s);
                  void handleSearch(s);
                }}
                className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-gray-600 hover:border-blue-500 hover:text-blue-600 text-[11px] font-mono transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!searched && !asset && !errorMsg && (
            <div className="text-center py-12 text-gray-400 space-y-2">
              <QrCode className="w-12 h-12 mx-auto text-gray-300 stroke-1" />
              <p className="text-xs">Nhập số Serial hoặc bấm vào các gợi ý thiết bị phía trên để tra cứu.</p>
            </div>
          )}

          {asset && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Device Overview Card */}
              <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      {asset.name.toLowerCase().includes('in') || asset.model.toLowerCase().includes('canon') ? (
                        <Printer className="w-6 h-6" />
                      ) : asset.name.toLowerCase().includes('server') ? (
                        <Server className="w-6 h-6" />
                      ) : (
                        <Laptop className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-gray-900">{asset.name}</h4>
                      <p className="text-xs text-gray-500">
                        {asset.manufacturer} • Model: <span className="font-medium text-gray-700">{asset.model}</span>
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    {asset.serialNumber}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100 text-xs">
                  <div>
                    <span className="text-gray-400 block">Vị trí lắp đặt:</span>
                    <span className="font-semibold text-gray-800">{asset.location || 'Chưa cập nhật'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Trạng thái thiết bị:</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {asset.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* TCO & Repair Count Card */}
              {tco && (
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-5 border border-indigo-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-indigo-900 uppercase tracking-wide">
                      Tổng Chi Phí Sở Hữu Lũy Kế (TCO)
                    </p>
                    <p className="text-2xl font-black text-indigo-950 mt-1">
                      {formatCurrency(tco.totalCostCents)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-indigo-700 block">Lịch sử bảo dưỡng</span>
                    <span className="text-xl font-bold text-indigo-900">{tco.repairCount} lần</span>
                    {tco.lastRepairedAt && (
                      <span className="text-[10px] text-indigo-600 block mt-0.5">
                        Lần sửa gần nhất: {new Date(tco.lastRepairedAt).toLocaleDateString('vi-VN')}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Repair History List */}
              <div className="space-y-3">
                <h5 className="font-bold text-xs text-gray-700 uppercase flex items-center gap-2">
                  <History className="w-4 h-4 text-blue-600" />
                  Lịch Sử Sửa Chữa &amp; Thay Thế Linh Kiện ({history.length})
                </h5>

                {history.length === 0 ? (
                  <p className="text-xs text-gray-400 italic py-2">Thiết bị chưa có ghi nhận sửa chữa trước đây.</p>
                ) : (
                  <div className="space-y-2">
                    {history.map((rec) => (
                      <div key={rec.id} className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-gray-800">{rec.description}</span>
                          <span className="font-mono font-bold text-indigo-700">
                            {formatCurrency(rec.repairCostCents + rec.partsCostCents)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[11px] text-gray-400">
                          <span>Mã ticket: {rec.ticketId}</span>
                          <span>
                            {rec.repairedAt ? new Date(rec.repairedAt).toLocaleDateString('vi-VN') : '—'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between flex-shrink-0">
          <span className="text-xs text-gray-400">Mã hóa chuẩn SRS v3.4</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-200 transition-colors"
            >
              Đóng
            </button>
            {asset && onSelectAsset && (
              <button
                type="button"
                onClick={() => {
                  onSelectAsset(asset.serialNumber, asset.name);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <span>Sử Dụng Serial Cho Phiếu Này</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
