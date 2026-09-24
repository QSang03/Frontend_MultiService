'use client';

import { useState } from 'react';
import { Download, Eye, RefreshCw } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';

interface Contract {
  id: string;
  title: string;
  type: 'one-deal' | 'long-term';
  typeLabel: string;
  value: string;
  period: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'expiring' | 'expired' | 'pending_sign';
  statusLabel: string;
  statusColor: string;
  signedByUs: boolean;
  signedByProvider: boolean;
}

const contracts: Contract[] = [
  { id: 'HĐ-2026-001', title: 'Bảo trì Server hàng tháng', type: 'long-term', typeLabel: 'Long-term', value: '15,000,000 VNĐ/tháng', period: '12 tháng', startDate: '01/01/2026', endDate: '31/12/2026', status: 'active', statusLabel: 'Đang hiệu lực', statusColor: 'bg-green-100 text-green-700', signedByUs: true, signedByProvider: true },
  { id: 'HĐ-2026-003', title: 'License Microsoft 365 Enterprise', type: 'long-term', typeLabel: 'Long-term', value: '5,000,000 VNĐ/tháng', period: '12 tháng', startDate: '01/03/2026', endDate: '28/02/2027', status: 'active', statusLabel: 'Đang hiệu lực', statusColor: 'bg-green-100 text-green-700', signedByUs: true, signedByProvider: true },
  { id: 'HĐ-2026-005', title: 'Triển khai hệ thống ERP', type: 'one-deal', typeLabel: 'One-deal', value: '150,000,000 VNĐ', period: '—', startDate: '15/02/2026', endDate: '15/05/2026', status: 'active', statusLabel: 'Đang hiệu lực', statusColor: 'bg-green-100 text-green-700', signedByUs: true, signedByProvider: true },
  { id: 'HĐ-2025-012', title: 'Bảo trì hệ thống mạng', type: 'long-term', typeLabel: 'Long-term', value: '8,000,000 VNĐ/tháng', period: '12 tháng', startDate: '01/04/2025', endDate: '31/03/2026', status: 'expiring', statusLabel: 'Sắp hết hạn', statusColor: 'bg-amber-100 text-amber-700', signedByUs: true, signedByProvider: true },
  { id: 'HĐ-2026-008', title: 'Nâng cấp hạ tầng server', type: 'one-deal', typeLabel: 'One-deal', value: '80,000,000 VNĐ', period: '—', startDate: '—', endDate: '—', status: 'pending_sign', statusLabel: 'Chờ ký', statusColor: 'bg-blue-100 text-blue-700', signedByUs: true, signedByProvider: false },
];

type ContractTab = 'all' | 'active' | 'expiring' | 'expired' | 'pending_sign';

const contractTabs: { key: ContractTab; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'active', label: 'Đang hiệu lực' },
  { key: 'expiring', label: 'Sắp hết hạn' },
  { key: 'expired', label: 'Đã hết hạn' },
  { key: 'pending_sign', label: 'Chờ ký' },
];

export default function ContractsB2B() {
  const [activeTab, setActiveTab] = useState<ContractTab>('all');

  const filtered = activeTab === 'all' ? contracts : contracts.filter((c) => c.status === activeTab);

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Quản lý Hợp đồng</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto">
        {contractTabs.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${activeTab === tab.key ? 'bg-white text-[#0f172a] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contract List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <EmptyState icon="file" title="Không có hợp đồng" description="Không có hợp đồng nào phù hợp với bộ lọc." />
        ) : filtered.map((c) => (
          <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-gray-500 text-sm">{c.id}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.statusColor}`}>{c.statusLabel}</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{c.typeLabel}</span>
                </div>
                <h3 className="font-semibold text-gray-900">{c.title}</h3>
              </div>
              <span className="text-lg font-bold text-gray-900 whitespace-nowrap">{c.value}</span>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
              <div><p className="text-gray-500">Bắt đầu</p><p className="font-medium text-gray-700">{c.startDate}</p></div>
              <div><p className="text-gray-500">Kết thúc</p><p className="font-medium text-gray-700">{c.endDate}</p></div>
              <div>
                <p className="text-gray-500">Trạng thái ký</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-xs ${c.signedByUs ? 'text-green-600' : 'text-gray-400'}`}>
                    {c.signedByUs ? '✅' : '⬜'} Bạn
                  </span>
                  <span className={`text-xs ${c.signedByProvider ? 'text-green-600' : 'text-amber-600'}`}>
                    {c.signedByProvider ? '✅' : '⏳'} NCC
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                <Eye className="w-4 h-4" /> Xem
              </button>
              {c.status === 'expiring' && (
                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors">
                  <RefreshCw className="w-4 h-4" /> Gia hạn
                </button>
              )}
              {c.status === 'pending_sign' && (
                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
                  ✍️ Ký điện tử
                </button>
              )}
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                <Download className="w-4 h-4" /> PDF
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
