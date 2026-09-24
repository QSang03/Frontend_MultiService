'use client';

import { useState, useMemo } from 'react';
import { Search, Filter, QrCode, Monitor, Printer, Server, History, Wrench, Download } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui';

interface Asset {
  id: string;
  name: string;
  serial: string;
  dept: string;
  user: string;
  status: 'active' | 'maintenance' | 'disposed';
  statusLabel: string;
  statusColor: string;
  tco: string;
  lastRepair: string;
  icon: React.ElementType;
}

const assets: Asset[] = [
  { id: '1', name: 'Máy in Canon LBP 2900', serial: 'CN20250001', dept: 'IT', user: 'Nguyễn Văn B', status: 'active', statusLabel: 'Đang sử dụng', statusColor: 'bg-green-100 text-green-700', tco: '3,200,000', lastRepair: '10/01/2026', icon: Printer },
  { id: '2', name: 'Dell Latitude 3520', serial: 'DL20240082', dept: 'Sales', user: 'Phạm Hải', status: 'maintenance', statusLabel: 'Bảo trì', statusColor: 'bg-yellow-100 text-yellow-700', tco: '12,500,000', lastRepair: '05/03/2026', icon: Monitor },
  { id: '3', name: 'NAS Synology DS920+', serial: 'SY20230045', dept: 'IT', user: 'Server Room', status: 'active', statusLabel: 'Đang sử dụng', statusColor: 'bg-green-100 text-green-700', tco: '8,000,000', lastRepair: '15/02/2026', icon: Server },
  { id: '4', name: 'HP ProDesk 400 G7', serial: 'HP20240120', dept: 'Marketing', user: 'Lê Thị D', status: 'active', statusLabel: 'Đang sử dụng', statusColor: 'bg-green-100 text-green-700', tco: '5,200,000', lastRepair: '20/12/2025', icon: Monitor },
  { id: '5', name: 'Canon MF 269dw', serial: 'CN20230078', dept: 'HR', user: 'Hoàng Mai', status: 'disposed', statusLabel: 'Chờ thanh lý', statusColor: 'bg-gray-100 text-gray-600', tco: '15,000,000', lastRepair: '01/02/2026', icon: Printer },
];

type AssetTab = 'all' | 'active' | 'maintenance' | 'disposed';

const assetTabs: { key: AssetTab; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'active', label: 'Đang sử dụng' },
  { key: 'maintenance', label: 'Bảo trì' },
  { key: 'disposed', label: 'Chờ thanh lý' },
];

export default function AssetsB2B() {
  const [search, setSearch] = useState('');
  const [, setSelectedAsset] = useState<Asset | null>(null);
  const [activeTab, setActiveTab] = useState<AssetTab>('all');
  const { addToast } = useToast();

  const filtered = useMemo(() => {
    let result = activeTab === 'all' ? assets : assets.filter((a) => a.status === activeTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.serial.toLowerCase().includes(q) ||
          a.dept.toLowerCase().includes(q) ||
          a.user.toLowerCase().includes(q)
      );
    }
    return result;
  }, [activeTab, search]);

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-gray-900">Quản lý Tài sản</h1>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-1.5 border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            Nhập từ Excel
          </button>
          <button className="inline-flex items-center gap-1.5 border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" /> Xuất báo cáo
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto">
        {assetTabs.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${activeTab === tab.key ? 'bg-white text-[#0f172a] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo tên, serial, phòng ban..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        <button className="inline-flex items-center gap-1.5 border border-gray-200 px-4 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
          <Filter className="w-4 h-4" /> Lọc
        </button>
      </div>

      {/* Asset Grid */}
      {filtered.length === 0 ? (
        <EmptyState icon="package" title="Không tìm thấy tài sản" description="Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm." />
      ) : (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((asset) => {
          const Icon = asset.icon;
          return (
            <div
              key={asset.id}
              onClick={() => setSelectedAsset(asset)}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-emerald-200 hover:shadow-sm transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Icon className="w-5 h-5 text-gray-600" />
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${asset.statusColor}`}>
                  {asset.statusLabel}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 text-sm">{asset.name}</h3>
              <p className="text-xs text-gray-500 font-mono mt-0.5">SN: {asset.serial}</p>
              <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <span>{asset.dept}</span>
                <span>TCO: <strong className="text-gray-700">{asset.tco} VNĐ</strong></span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                <span>👤 {asset.user}</span>
                <span>Sửa: {asset.lastRepair}</span>
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={(e) => { e.stopPropagation(); addToast('Tính năng đang phát triển', { type: 'info' }); }} className="flex-1 flex items-center justify-center gap-1 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50">
                  <History className="w-3 h-3" /> Lịch sử
                </button>
                <button onClick={(e) => { e.stopPropagation(); addToast('Tính năng đang phát triển', { type: 'info' }); }} className="flex-1 flex items-center justify-center gap-1 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50">
                  <Wrench className="w-3 h-3" /> Báo hỏng
                </button>
                <button onClick={(e) => { e.stopPropagation(); addToast('Tính năng đang phát triển', { type: 'info' }); }} className="flex items-center justify-center gap-1 py-1.5 px-2 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50">
                  <QrCode className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}
