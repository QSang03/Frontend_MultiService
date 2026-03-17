'use client';

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Search, Filter, QrCode, Monitor, Printer, Server, History, Wrench, Download, TrendingUp, AlertTriangle, X, ChevronRight, BarChart3 } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui';

interface RepairRecord {
  date: string;
  description: string;
  cost: string;
  tech: string;
}

interface Asset {
  id: string;
  name: string;
  serial: string;
  dept: string;
  user: string;
  status: 'active' | 'maintenance' | 'disposed';
  statusLabel: string;
  statusColor: string;
  tcoTotal: string;
  tcoBreakdown: { purchase: string; repair: string; parts: string };
  lastRepair: string;
  nextMaintenance: string | null; // null = no upcoming
  daysUntilMaintenance: number | null;
  repairHistory: RepairRecord[];
  icon: React.ElementType;
}

const assets: Asset[] = [
  {
    id: '1',
    name: 'Máy in Canon LBP 2900',
    serial: 'CN20250001',
    dept: 'IT',
    user: 'Nguyễn Văn B',
    status: 'active',
    statusLabel: 'Đang sử dụng',
    statusColor: 'bg-emerald-100 text-emerald-700',
    tcoTotal: '3,200,000',
    tcoBreakdown: { purchase: '1,500,000', repair: '1,200,000', parts: '500,000' },
    lastRepair: '10/01/2026',
    nextMaintenance: '15/04/2026',
    daysUntilMaintenance: 8,
    repairHistory: [
      { date: '10/01/2026', description: 'Thay drum unit', cost: '800,000', tech: 'Trần Kỹ Thuật' },
      { date: '05/09/2025', description: 'Vệ sinh roller, thay toner', cost: '400,000', tech: 'Lê Văn H' },
    ],
    icon: Printer,
  },
  {
    id: '2',
    name: 'Dell Latitude 3520',
    serial: 'DL20240082',
    dept: 'Sales',
    user: 'Phạm Hải',
    status: 'maintenance',
    statusLabel: 'Bảo trì',
    statusColor: 'bg-amber-100 text-amber-700',
    tcoTotal: '12,500,000',
    tcoBreakdown: { purchase: '9,000,000', repair: '2,500,000', parts: '1,000,000' },
    lastRepair: '05/03/2026',
    nextMaintenance: '05/03/2026',
    daysUntilMaintenance: -3, // overdue
    repairHistory: [
      { date: '05/03/2026', description: 'Thay pin, vệ sinh fan', cost: '1,500,000', tech: 'Nguyễn KT' },
      { date: '12/11/2025', description: 'Cài lại hệ điều hành', cost: '500,000', tech: 'Trần KT' },
      { date: '20/06/2025', description: 'Thay HDD → SSD 512GB', cost: '1,200,000', tech: 'Lê KT' },
    ],
    icon: Monitor,
  },
  {
    id: '3',
    name: 'NAS Synology DS920+',
    serial: 'SY20230045',
    dept: 'IT',
    user: 'Server Room',
    status: 'active',
    statusLabel: 'Đang sử dụng',
    statusColor: 'bg-emerald-100 text-emerald-700',
    tcoTotal: '8,000,000',
    tcoBreakdown: { purchase: '7,000,000', repair: '800,000', parts: '200,000' },
    lastRepair: '15/02/2026',
    nextMaintenance: null,
    daysUntilMaintenance: null,
    repairHistory: [
      { date: '15/02/2026', description: 'Mở rộng RAM 8GB → 16GB', cost: '800,000', tech: 'Lê Văn H' },
    ],
    icon: Server,
  },
  {
    id: '4',
    name: 'HP ProDesk 400 G7',
    serial: 'HP20240120',
    dept: 'Marketing',
    user: 'Lê Thị D',
    status: 'active',
    statusLabel: 'Đang sử dụng',
    statusColor: 'bg-emerald-100 text-emerald-700',
    tcoTotal: '5,200,000',
    tcoBreakdown: { purchase: '4,500,000', repair: '500,000', parts: '200,000' },
    lastRepair: '20/12/2025',
    nextMaintenance: '20/06/2026',
    daysUntilMaintenance: 90,
    repairHistory: [
      { date: '20/12/2025', description: 'Vệ sinh tổng thể', cost: '200,000', tech: 'Nguyễn KT' },
    ],
    icon: Monitor,
  },
  {
    id: '5',
    name: 'Canon MF 269dw',
    serial: 'CN20230078',
    dept: 'HR',
    user: 'Hoàng Mai',
    status: 'disposed',
    statusLabel: 'Chờ thanh lý',
    statusColor: 'bg-gray-100 text-gray-600',
    tcoTotal: '15,000,000',
    tcoBreakdown: { purchase: '6,000,000', repair: '6,500,000', parts: '2,500,000' },
    lastRepair: '01/02/2026',
    nextMaintenance: null,
    daysUntilMaintenance: null,
    repairHistory: [
      { date: '01/02/2026', description: 'Thay fuser unit', cost: '2,500,000', tech: 'Lê KT' },
      { date: '15/10/2025', description: 'Thay trống mực', cost: '1,800,000', tech: 'Trần KT' },
      { date: '02/05/2025', description: 'Sửa kẹt giấy mãn tính', cost: '1,200,000', tech: 'Nguyễn KT' },
      { date: '10/01/2025', description: 'Thay drum unit', cost: '1,000,000', tech: 'Lê KT' },
    ],
    icon: Printer,
  },
];

type AssetTab = 'all' | 'active' | 'maintenance' | 'disposed';
const assetTabs: { key: AssetTab; label: string; count: number }[] = [
  { key: 'all', label: 'Tất cả', count: assets.length },
  { key: 'active', label: 'Đang sử dụng', count: assets.filter(a => a.status === 'active').length },
  { key: 'maintenance', label: 'Bảo trì', count: assets.filter(a => a.status === 'maintenance').length },
  { key: 'disposed', label: 'Chờ thanh lý', count: assets.filter(a => a.status === 'disposed').length },
];

function MaintenanceBadge({ days }: { days: number | null }) {
  if (days === null) return null;
  if (days < 0) return (
    <span className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
      <AlertTriangle className="w-3 h-3" />
      Quá hạn {Math.abs(days)} ngày
    </span>
  );
  if (days <= 14) return (
    <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
      <AlertTriangle className="w-3 h-3" />
      BT trong {days} ngày
    </span>
  );
  return null;
}

function TCOModal({ asset, onClose }: { asset: Asset; onClose: () => void }) {
  const total = parseInt(asset.tcoTotal.replace(/,/g, ''), 10);
  const purchase = parseInt(asset.tcoBreakdown.purchase.replace(/,/g, ''), 10);
  const repair = parseInt(asset.tcoBreakdown.repair.replace(/,/g, ''), 10);
  const parts = parseInt(asset.tcoBreakdown.parts.replace(/,/g, ''), 10);

  const bars = [
    { label: 'Mua sắm ban đầu', value: purchase, color: 'bg-blue-500', pct: Math.round((purchase/total)*100) },
    { label: 'Chi phí sửa chữa', value: repair, color: 'bg-amber-500', pct: Math.round((repair/total)*100) },
    { label: 'Linh kiện / phụ tùng', value: parts, color: 'bg-emerald-500', pct: Math.round((parts/total)*100) },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <h2 className="font-bold text-gray-900">TCO & Lịch sử sửa chữa</h2>
            </div>
            <p className="text-sm text-gray-500">{asset.name} — <span className="font-mono text-xs">{asset.serial}</span></p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* TCO Summary */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
            <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-1">Tổng chi phí sở hữu (TCO)</p>
            <p className="text-3xl font-bold text-blue-900">{asset.tcoTotal} <span className="text-base font-normal text-blue-600">VNĐ</span></p>
          </div>

          {/* Breakdown bars */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Phân tích chi phí</h3>
            {bars.map(b => (
              <div key={b.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600">{b.label}</span>
                  <span className="font-semibold text-gray-800">{b.value.toLocaleString('vi-VN')} VNĐ <span className="text-gray-400">({b.pct}%)</span></span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${b.color} rounded-full transition-all duration-700`} style={{ width: `${b.pct}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/* Repair Timeline */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Lịch sử sửa chữa</h3>
            {asset.repairHistory.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Chưa có lịch sử sửa chữa</p>
            ) : (
              <div className="relative pl-5">
                <div className="absolute left-2 top-2 bottom-2 w-px bg-gray-200" />
                {asset.repairHistory.map((r, i) => (
                  <div key={i} className="relative mb-4 last:mb-0">
                    <div className="absolute -left-3 top-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 ml-1">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-semibold text-gray-600">{r.date}</span>
                        <span className="text-xs font-bold text-amber-600">{r.cost} VNĐ</span>
                      </div>
                      <p className="text-sm text-gray-800">{r.description}</p>
                      <p className="text-xs text-gray-500 mt-0.5">KT: {r.tech}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Maintenance Alert */}
          {asset.daysUntilMaintenance !== null && asset.daysUntilMaintenance <= 14 && (
            <div className={`rounded-xl p-4 border ${asset.daysUntilMaintenance < 0 ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
              <div className="flex items-center gap-2">
                <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${asset.daysUntilMaintenance < 0 ? 'text-red-500' : 'text-amber-500'}`} />
                <div>
                  <p className={`text-sm font-semibold ${asset.daysUntilMaintenance < 0 ? 'text-red-700' : 'text-amber-700'}`}>
                    {asset.daysUntilMaintenance < 0
                      ? `Đã quá hạn bảo dưỡng ${Math.abs(asset.daysUntilMaintenance)} ngày!`
                      : `Đến hạn bảo dưỡng trong ${asset.daysUntilMaintenance} ngày`
                    }
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Ngày bảo dưỡng dự kiến: {asset.nextMaintenance}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AssetsB2B() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<AssetTab>('all');
  const [tcoAsset, setTcoAsset] = useState<Asset | null>(null);
  const { addToast } = useToast();

  const filtered = useMemo(() => {
    let result = activeTab === 'all' ? assets : assets.filter(a => a.status === activeTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.serial.toLowerCase().includes(q) ||
        a.dept.toLowerCase().includes(q) ||
        a.user.toLowerCase().includes(q)
      );
    }
    return result;
  }, [activeTab, search]);

  const urgentCount = assets.filter(a => a.daysUntilMaintenance !== null && a.daysUntilMaintenance <= 14).length;

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Quản lý Tài sản</h1>
          {urgentCount > 0 && (
            <p className="text-sm text-red-600 mt-0.5 flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" />
              {urgentCount} tài sản cần chú ý bảo dưỡng
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={() => addToast('Tính năng đang phát triển', { type: 'info' })} className="inline-flex items-center gap-1.5 border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            Nhập từ Excel
          </button>
          <button onClick={() => addToast('Đang xuất báo cáo...', { type: 'success' })} className="inline-flex items-center gap-1.5 border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" /> Xuất báo cáo
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto">
        {assetTabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {tab.label}
            <span className={`text-xs rounded-full px-1.5 py-0.5 ${activeTab === tab.key ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'}`}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo tên, serial, phòng ban..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
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
          {filtered.map(asset => {
            const Icon = asset.icon;
            const isUrgent = asset.daysUntilMaintenance !== null && asset.daysUntilMaintenance <= 14;
            return (
              <div key={asset.id}
                className={`bg-white rounded-xl border p-5 hover:shadow-md transition-all cursor-pointer ${isUrgent ? 'border-amber-200 bg-amber-50/30' : 'border-gray-200 hover:border-emerald-200'}`}
                onClick={() => setTcoAsset(asset)}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${asset.statusColor}`}>{asset.statusLabel}</span>
                    <MaintenanceBadge days={asset.daysUntilMaintenance} />
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 text-sm">{asset.name}</h3>
                <p className="text-xs text-gray-500 font-mono mt-0.5">SN: {asset.serial}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                  <span>{asset.dept}</span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-blue-500" />
                    TCO: <strong className="text-gray-700">{asset.tcoTotal} VNĐ</strong>
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                  <span>👤 {asset.user}</span>
                  <span>Sửa: {asset.lastRepair}</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <button onClick={e => { e.stopPropagation(); setTcoAsset(asset); }}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 border border-blue-200 bg-blue-50 rounded-lg text-xs text-blue-700 hover:bg-blue-100 transition-colors font-medium">
                    <BarChart3 className="w-3 h-3" /> TCO
                  </button>
                  <button onClick={e => { e.stopPropagation(); setTcoAsset(asset); }}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 transition-colors">
                    <History className="w-3 h-3" /> Lịch sử
                  </button>
                  <button onClick={e => { e.stopPropagation(); addToast('Tính năng đang phát triển', { type: 'info' }); }}
                    className="flex items-center justify-center gap-1 py-1.5 px-2 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 transition-colors">
                    <QrCode className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TCO Modal */}
      {tcoAsset && <TCOModal asset={tcoAsset} onClose={() => setTcoAsset(null)} />}
    </div>
  );
}
