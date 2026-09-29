'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Filter,
  QrCode,
  Monitor,
  Printer,
  Server,
  History,
  Wrench,
  Download,
  TrendingUp,
  AlertTriangle,
  X,
  ChevronRight,
  BarChart3,
  RefreshCw,
  Printer as PrintIcon,
  Plus,
  ExternalLink,
  Laptop,
  HardDrive,
  Cpu,
} from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui';
import Link from 'next/link';

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
  nextMaintenance: string | null;
  daysUntilMaintenance: number | null;
  repairHistory: RepairRecord[];
  icon: React.ElementType;
}

const DEFAULT_ASSETS: Asset[] = [
  {
    id: '1',
    name: 'Máy in Canon LBP 2900',
    serial: 'CN20250001',
    dept: 'IT Support',
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
    name: 'Laptop Dell Latitude 3520',
    serial: 'DL20240082',
    dept: 'Sales & Marketing',
    user: 'Phạm Hải Long',
    status: 'maintenance',
    statusLabel: 'Bảo trì',
    statusColor: 'bg-amber-100 text-amber-700',
    tcoTotal: '12,500,000',
    tcoBreakdown: { purchase: '9,000,000', repair: '2,500,000', parts: '1,000,000' },
    lastRepair: '05/03/2026',
    nextMaintenance: '05/03/2026',
    daysUntilMaintenance: -3,
    repairHistory: [
      { date: '05/03/2026', description: 'Thay pin, vệ sinh fan', cost: '1,500,000', tech: 'Nguyễn KT' },
      { date: '12/11/2025', description: 'Cài lại hệ điều hành', cost: '500,000', tech: 'Trần KT' },
      { date: '20/06/2025', description: 'Thay HDD → SSD 512GB', cost: '1,200,000', tech: 'Lê KT' },
    ],
    icon: Laptop,
  },
  {
    id: '3',
    name: 'Máy chủ NAS Synology DS920+',
    serial: 'SY20230045',
    dept: 'IT Infrastructure',
    user: 'Server Room Tầng 3',
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
    name: 'Máy tính để bàn HP ProDesk 400 G7',
    serial: 'HP20240120',
    dept: 'Kế toán & Tài chính',
    user: 'Lê Thị Diễm',
    status: 'active',
    statusLabel: 'Đang sử dụng',
    statusColor: 'bg-emerald-100 text-emerald-700',
    tcoTotal: '5,200,000',
    tcoBreakdown: { purchase: '4,500,000', repair: '500,000', parts: '200,000' },
    lastRepair: '20/12/2025',
    nextMaintenance: '20/06/2026',
    daysUntilMaintenance: 90,
    repairHistory: [
      { date: '20/12/2025', description: 'Vệ sinh tổng thể & tra keo tản nhiệt', cost: '200,000', tech: 'Nguyễn KT' },
    ],
    icon: Monitor,
  },
  {
    id: '5',
    name: 'Máy in đa năng Canon MF 269dw',
    serial: 'CN20230078',
    dept: 'Nhân sự HR',
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
      { date: '01/02/2026', description: 'Thay fuser unit cụm sấy', cost: '2,500,000', tech: 'Lê KT' },
      { date: '15/10/2025', description: 'Thay trống mực & gạt mực', cost: '1,800,000', tech: 'Trần KT' },
      { date: '02/05/2025', description: 'Sửa kẹt giấy cơ kéo', cost: '1,200,000', tech: 'Nguyễn KT' },
      { date: '10/01/2025', description: 'Thay drum unit', cost: '1,000,000', tech: 'Lê KT' },
    ],
    icon: Printer,
  },
];

type AssetTab = 'all' | 'active' | 'maintenance' | 'disposed';

function MaintenanceBadge({ days }: { days: number | null }) {
  if (days === null) return null;
  if (days < 0)
    return (
      <span className="flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-full px-2 py-0.5 animate-pulse">
        <AlertTriangle className="w-3 h-3" />
        Quá hạn {Math.abs(days)} ngày
      </span>
    );
  if (days <= 14)
    return (
      <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
        <AlertTriangle className="w-3 h-3" />
        Bảo dưỡng trong {days} ngày
      </span>
    );
  return null;
}

function QRModal({ asset, onClose }: { asset: Asset; onClose: () => void }) {
  const [qrUrl, setQrUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/customer/b2b/assets?assetId=${asset.id}&qr=true`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.qrCodeUrl) {
          setQrUrl(data.qrCodeUrl);
        } else {
          setQrUrl(`https://it-multiservice.io/asset/${asset.serial}`);
        }
      })
      .catch(() => {
        setQrUrl(`https://it-multiservice.io/asset/${asset.serial}`);
      })
      .finally(() => setLoading(false));
  }, [asset.id, asset.serial]);

  const qrImageSrc = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    qrUrl || asset.serial
  )}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-gray-900">Mã QR Thiết Bị</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 text-center space-y-4">
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl inline-block shadow-inner">
            {loading ? (
              <div className="w-[200px] h-[200px] flex items-center justify-center text-xs text-gray-400">
                Đang nạp mã QR...
              </div>
            ) : (
              <img
                src={qrImageSrc}
                alt={`QR code for ${asset.name}`}
                className="w-[200px] h-[200px] mx-auto rounded"
              />
            )}
          </div>

          <div>
            <h4 className="font-bold text-gray-900 text-sm">{asset.name}</h4>
            <p className="text-xs font-mono text-gray-500 mt-0.5">Serial: {asset.serial}</p>
            <p className="text-xs text-gray-400 mt-1">Phòng ban: {asset.dept} • Người dùng: {asset.user}</p>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800 text-left">
            💡 <strong>Hướng dẫn:</strong> Kỹ thuật viên hiện trường dùng Mobile App quét tem QR này để tra cứu ngay lịch sử sửa chữa và kích hoạt biên bản bàn giao điện tử.
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => window.print()}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-gray-300 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50"
            >
              <PrintIcon className="w-3.5 h-3.5" />
              In Tem Nhãn
            </button>
            <a
              href={qrImageSrc}
              download={`QR_${asset.serial}.png`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700"
            >
              <Download className="w-3.5 h-3.5" />
              Tải Hình Ảnh
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function TCOModal({ asset, onClose }: { asset: Asset; onClose: () => void }) {
  const [liveTco, setLiveTco] = useState<{
    totalCostCents?: number;
    repairCount?: number;
    costByCategory?: Record<string, number>;
  } | null>(null);
  const [liveHistory, setLiveHistory] = useState<RepairRecord[] | null>(null);

  useEffect(() => {
    fetch(`/api/customer/b2b/assets?assetId=${asset.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.tco) {
          setLiveTco(data.tco);
        }
        if (data?.repairHistory && data.repairHistory.length > 0) {
          setLiveHistory(
            data.repairHistory.map((r: any) => ({
              date: r.repairedAt ? r.repairedAt.slice(0, 10) : 'Gần đây',
              description: r.description,
              cost: (r.repairCostCents + r.partsCostCents).toLocaleString('vi-VN'),
              tech: r.technicianId || 'KTV Trung Tâm',
            }))
          );
        }
      })
      .catch((e) => console.warn('Could not load live TCO:', e));
  }, [asset.id]);

  const total = parseInt(asset.tcoTotal.replace(/,/g, ''), 10);
  const purchase = parseInt(asset.tcoBreakdown.purchase.replace(/,/g, ''), 10);
  const repair = parseInt(asset.tcoBreakdown.repair.replace(/,/g, ''), 10);
  const parts = parseInt(asset.tcoBreakdown.parts.replace(/,/g, ''), 10);

  const bars = [
    { label: 'Mua sắm ban đầu', value: purchase, color: 'bg-blue-500', pct: Math.round((purchase / total) * 100) },
    { label: 'Chi phí sửa chữa', value: repair, color: 'bg-amber-500', pct: Math.round((repair / total) * 100) },
    { label: 'Linh kiện / phụ tùng', value: parts, color: 'bg-emerald-500', pct: Math.round((parts / total) * 100) },
  ];

  const historyToShow = liveHistory || asset.repairHistory;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <h2 className="font-bold text-gray-900">Tổng Chi Phí Sở Hữu (TCO) & Vòng Đời</h2>
            </div>
            <p className="text-sm text-gray-500">
              {asset.name} — <span className="font-mono text-xs font-semibold">{asset.serial}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* TCO Summary */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100 flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-1">
                Tổng chi phí sở hữu lũy kế (TCO)
              </p>
              <p className="text-3xl font-bold text-blue-900">
                {asset.tcoTotal} <span className="text-base font-normal text-blue-600">VNĐ</span>
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-500 block">Số lần bảo dưỡng</span>
              <span className="text-lg font-bold text-indigo-700">
                {liveTco?.repairCount ?? historyToShow.length} lần
              </span>
            </div>
          </div>

          {/* Breakdown bars */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Cấu thành chi phí</h3>
            {bars.map((b) => (
              <div key={b.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600">{b.label}</span>
                  <span className="font-semibold text-gray-800">
                    {b.value.toLocaleString('vi-VN')} VNĐ <span className="text-gray-400">({b.pct}%)</span>
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${b.color} rounded-full transition-all duration-700`}
                    style={{ width: `${b.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Repair Timeline */}
          <div>
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
              Lịch sử bảo trì & sửa chữa ({historyToShow.length})
            </h3>
            {historyToShow.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Chưa có lịch sử sửa chữa</p>
            ) : (
              <div className="relative pl-5 space-y-3">
                <div className="absolute left-2 top-2 bottom-2 w-px bg-gray-200" />
                {historyToShow.map((r, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-3 top-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 ml-1">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-semibold text-gray-600">{r.date}</span>
                        <span className="text-xs font-bold text-amber-600">{r.cost} VNĐ</span>
                      </div>
                      <p className="text-sm text-gray-800 font-medium">{r.description}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Kỹ thuật viên phụ trách: {r.tech}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Maintenance Alert */}
          {asset.daysUntilMaintenance !== null && asset.daysUntilMaintenance <= 14 && (
            <div
              className={`rounded-xl p-4 border ${
                asset.daysUntilMaintenance < 0 ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <AlertTriangle
                  className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                    asset.daysUntilMaintenance < 0 ? 'text-red-500' : 'text-amber-500'
                  }`}
                />
                <div className="flex-1">
                  <p
                    className={`text-sm font-semibold ${
                      asset.daysUntilMaintenance < 0 ? 'text-red-700' : 'text-amber-700'
                    }`}
                  >
                    {asset.daysUntilMaintenance < 0
                      ? `Đã quá hạn bảo dưỡng định kỳ ${Math.abs(asset.daysUntilMaintenance)} ngày!`
                      : `Đến hạn bảo dưỡng định kỳ trong ${asset.daysUntilMaintenance} ngày`}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Ngày dự kiến: {asset.nextMaintenance}</p>
                </div>
                <Link
                  href={`/customer/b2b/tickets?new=true&asset=${encodeURIComponent(asset.serial)}`}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold whitespace-nowrap transition-colors"
                >
                  Tạo Ticket
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AssetsB2B() {
  const [assetList, setAssetList] = useState<Asset[]>(DEFAULT_ASSETS);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<AssetTab>('all');
  const [tcoAsset, setTcoAsset] = useState<Asset | null>(null);
  const [qrAsset, setQrAsset] = useState<Asset | null>(null);
  const { addToast } = useToast();

  const fetchAssets = async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/customer/b2b/assets');
      if (res.ok) {
        const data = await res.json();
        if (data.assets && data.assets.length > 0) {
          const mapped: Asset[] = data.assets.map((item: any, idx: number) => {
            const isMaint = item.status === 'maintenance';
            const isDisposed = item.status === 'disposed';
            return {
              id: item.id || `live-${idx}`,
              name: item.name || 'Thiết bị CNTT',
              serial: item.serialNumber || `SN-${idx + 100}`,
              dept: item.location || 'Văn phòng chính',
              user: item.description || 'Chung',
              status: (isDisposed ? 'disposed' : isMaint ? 'maintenance' : 'active') as Asset['status'],
              statusLabel: isDisposed ? 'Chờ thanh lý' : isMaint ? 'Bảo trì' : 'Đang sử dụng',
              statusColor: isDisposed
                ? 'bg-gray-100 text-gray-600'
                : isMaint
                ? 'bg-amber-100 text-amber-700'
                : 'bg-emerald-100 text-emerald-700',
              tcoTotal: '4,500,000',
              tcoBreakdown: { purchase: '3,500,000', repair: '800,000', parts: '200,000' },
              lastRepair: '15/01/2026',
              nextMaintenance: '15/07/2026',
              daysUntilMaintenance: 12,
              repairHistory: [],
              icon: item.model?.toLowerCase().includes('print') ? Printer : Laptop,
            };
          });
          setAssetList(mapped);
        }
      }
    } catch (e) {
      console.warn('Lỗi khi tải danh sách tài sản, dùng bộ mặc định:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const assetTabs: { key: AssetTab; label: string; count: number }[] = useMemo(
    () => [
      { key: 'all', label: 'Tất cả', count: assetList.length },
      { key: 'active', label: 'Đang sử dụng', count: assetList.filter((a) => a.status === 'active').length },
      { key: 'maintenance', label: 'Bảo trì', count: assetList.filter((a) => a.status === 'maintenance').length },
      { key: 'disposed', label: 'Chờ thanh lý', count: assetList.filter((a) => a.status === 'disposed').length },
    ],
    [assetList]
  );

  const filtered = useMemo(() => {
    let result = activeTab === 'all' ? assetList : assetList.filter((a) => a.status === activeTab);
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
  }, [activeTab, search, assetList]);

  const urgentCount = assetList.filter(
    (a) => a.daysUntilMaintenance !== null && a.daysUntilMaintenance <= 14
  ).length;

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">Quản Lý Vòng Đời Tài Sản (ITAM Lite & TCO)</h1>
            <button
              onClick={fetchAssets}
              disabled={refreshing}
              className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-colors"
              title="Làm mới"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
          {urgentCount > 0 ? (
            <p className="text-xs text-red-600 mt-1 flex items-center gap-1 font-semibold">
              <AlertTriangle className="w-3.5 h-3.5" />
              {urgentCount} thiết bị sắp hoặc đã quá hạn bảo dưỡng định kỳ
            </p>
          ) : (
            <p className="text-xs text-gray-500 mt-1">
              Theo dõi vòng đời thiết bị, chi phí TCO thực tế và mã định danh QR tại chỗ
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Link
            href="/customer/b2b/tickets?new=true"
            className="inline-flex items-center gap-1.5 bg-blue-600 text-white px-3.5 py-2 rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Yêu cầu sửa chữa / Thay thế
          </Link>
          <button
            onClick={() => {
              const csv = [
                ['Tên thiết bị', 'Serial', 'Phòng ban', 'Người dùng', 'Trạng thái', 'TCO (VNĐ)'],
                ...assetList.map((a) => [a.name, a.serial, a.dept, a.user, a.statusLabel, a.tcoTotal]),
              ]
                .map((row) => row.join(','))
                .join('\n');
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `assets_export_${Date.now()}.csv`;
              a.click();
              addToast('Đã xuất báo cáo CSV thành công!', { type: 'success' });
            }}
            className="inline-flex items-center gap-1.5 border border-gray-300 bg-white text-gray-700 px-3.5 py-2 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Xuất Báo Cáo
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto">
        {assetTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            <span
              className={`text-[10px] rounded-full px-1.5 py-0.2 ${
                activeTab === tab.key ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên thiết bị, mã Serial, phòng ban hoặc người đang sử dụng..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
        </div>
      </div>

      {/* Asset Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="package"
          title="Không tìm thấy thiết bị"
          description="Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm."
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((asset) => {
            const Icon = asset.icon;
            const isUrgent = asset.daysUntilMaintenance !== null && asset.daysUntilMaintenance <= 14;
            return (
              <div
                key={asset.id}
                className={`bg-white rounded-xl border p-5 hover:shadow-md transition-all cursor-pointer ${
                  isUrgent ? 'border-amber-300 bg-amber-50/20' : 'border-gray-200 hover:border-blue-300'
                }`}
                onClick={() => setTcoAsset(asset)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${asset.statusColor}`}>
                      {asset.statusLabel}
                    </span>
                    <MaintenanceBadge days={asset.daysUntilMaintenance} />
                  </div>
                </div>

                <h3 className="font-bold text-gray-900 text-sm line-clamp-1">{asset.name}</h3>
                <p className="text-xs text-gray-500 font-mono mt-0.5 font-medium">SN: {asset.serial}</p>

                <div className="mt-3 flex items-center justify-between text-xs text-gray-600 border-t border-gray-100 pt-2.5">
                  <span className="font-medium">{asset.dept}</span>
                  <span className="flex items-center gap-1 font-bold text-blue-700">
                    <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                    TCO: {asset.tcoTotal} đ
                  </span>
                </div>

                <div className="mt-1.5 flex items-center justify-between text-[11px] text-gray-400">
                  <span>👤 {asset.user}</span>
                  <span>Lần sửa cuối: {asset.lastRepair}</span>
                </div>

                <div className="mt-3.5 flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTcoAsset(asset);
                    }}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 border border-blue-200 bg-blue-50 rounded-lg text-xs text-blue-700 hover:bg-blue-100 transition-colors font-semibold"
                  >
                    <BarChart3 className="w-3.5 h-3.5" /> TCO
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTcoAsset(asset);
                    }}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 border border-gray-200 bg-gray-50 rounded-lg text-xs text-gray-700 hover:bg-gray-100 transition-colors font-medium"
                  >
                    <History className="w-3.5 h-3.5" /> Lịch sử
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setQrAsset(asset);
                    }}
                    title="Mã QR định danh"
                    className="flex items-center justify-center gap-1 py-1.5 px-3 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg text-xs text-gray-700 transition-colors"
                  >
                    <QrCode className="w-3.5 h-3.5 text-gray-700" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {tcoAsset && <TCOModal asset={tcoAsset} onClose={() => setTcoAsset(null)} />}
      {qrAsset && <QRModal asset={qrAsset} onClose={() => setQrAsset(null)} />}
    </div>
  );
}

