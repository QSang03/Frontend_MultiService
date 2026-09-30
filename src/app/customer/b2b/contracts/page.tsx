'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Download, Eye, RefreshCw, Loader2, FileText } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import { toast } from '@/components/ui/Toast';
import ContractDetailModal from '@/components/contract/ContractDetailModal';
import SignContractModal from '@/components/contract/SignContractModal';
import RenewContractModal from '@/components/contract/RenewContractModal';
import type { Contract, ContractTimelineEvent } from '@/types/contract';
import { ContractStatus } from '@/types/contract';

interface ContractItem {
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
  pdfUrl?: string;
  customerName?: string;
}

type ContractTab = 'all' | 'active' | 'expiring' | 'expired' | 'pending_sign';

const contractTabs: { key: ContractTab; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'active', label: 'Đang hiệu lực' },
  { key: 'expiring', label: 'Sắp hết hạn' },
  { key: 'expired', label: 'Đã hết hạn' },
  { key: 'pending_sign', label: 'Chờ ký' },
];

function fmtDate(d?: string): string {
  if (!d) return '—';
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return d;
    return date.toLocaleDateString('vi-VN');
  } catch {
    return d;
  }
}

export default function ContractsB2B() {
  const [activeTab, setActiveTab] = useState<ContractTab>('all');
  const [contracts, setContracts] = useState<ContractItem[]>([]);
  const [rawContractsMap, setRawContractsMap] = useState<Record<string, Contract>>({});
  const [loading, setLoading] = useState(true);

  // Modal states
  const [selectedContractForDetail, setSelectedContractForDetail] = useState<Contract | null>(null);
  const [selectedContractForSign, setSelectedContractForSign] = useState<ContractItem | null>(null);
  const [selectedContractForRenew, setSelectedContractForRenew] = useState<ContractItem | null>(null);

  const fetchContracts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/contracts?pageSize=50');
      const data = await res.json();
      if (data.success && Array.isArray(data.data?.contracts)) {
        const rawList: Contract[] = data.data.contracts;
        const rawMap: Record<string, Contract> = {};

        const mapped: ContractItem[] = rawList.map((c: Contract) => {
          rawMap[c.id] = c;
          const start = c.startDate ? new Date(c.startDate) : null;
          const end = c.endDate ? new Date(c.endDate) : null;
          const now = new Date();

          let isExpiring = false;
          if (end && !isNaN(end.getTime())) {
            const diffDays = (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
            if (diffDays > 0 && diffDays <= 30) {
              isExpiring = true;
            }
          }

          // Determine status
          let status: ContractItem['status'] = 'active';
          let statusLabel = 'Đang hiệu lực';
          let statusColor = 'bg-green-100 text-green-700';

          const statusCode = Number(c.status);
          if (statusCode === 2 || statusCode === 1) {
            status = 'pending_sign';
            statusLabel = 'Chờ ký';
            statusColor = 'bg-blue-100 text-blue-700';
          } else if (statusCode === 4 || statusCode === 5 || (end && end.getTime() < now.getTime() && statusCode !== 3)) {
            status = 'expired';
            statusLabel = 'Đã hết hạn';
            statusColor = 'bg-gray-100 text-gray-700';
          } else if (isExpiring) {
            status = 'expiring';
            statusLabel = 'Sắp hết hạn';
            statusColor = 'bg-amber-100 text-amber-700';
          }

          const isLongTerm = start && end && (end.getTime() - start.getTime()) > 60 * 24 * 3600 * 1000;
          const valNum = Number(c.totalValue || 0);

          return {
            id: c.id || 'HD-NEW',
            title: c.title || 'Hợp đồng dịch vụ IT',
            type: isLongTerm ? 'long-term' : 'one-deal',
            typeLabel: isLongTerm ? 'Dài hạn' : 'Theo vụ việc',
            value: valNum > 0 ? `${valNum.toLocaleString('vi-VN')} VNĐ` : 'Chưa định giá',
            period: isLongTerm ? '12 tháng' : '—',
            startDate: fmtDate(c.startDate),
            endDate: fmtDate(c.endDate),
            status,
            statusLabel,
            statusColor,
            signedByUs: Boolean(c.signatureUrl || c.signedAt),
            signedByProvider: statusCode === 3 || Boolean(c.signatureUrl),
            pdfUrl: c.pdfUrl,
            customerName: c.customerName,
          };
        });

        setRawContractsMap(rawMap);
        setContracts(mapped);
      }
    } catch (err) {
      console.error('Failed to load contracts', err);
      toast.error('Không thể tải danh sách hợp đồng');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  const filtered = useMemo(() => {
    return activeTab === 'all' ? contracts : contracts.filter((c) => c.status === activeTab);
  }, [contracts, activeTab]);

  const tabCounts = useMemo(() => {
    return {
      active: contracts.filter((c) => c.status === 'active').length,
      expiring: contracts.filter((c) => c.status === 'expiring').length,
      expired: contracts.filter((c) => c.status === 'expired').length,
      pending_sign: contracts.filter((c) => c.status === 'pending_sign').length,
    };
  }, [contracts]);

  const handleOpenDetail = (c: ContractItem) => {
    const raw = rawContractsMap[c.id];
    if (raw) {
      setSelectedContractForDetail(raw);
    } else {
      // Fallback object matching Contract interface
      setSelectedContractForDetail({
        id: c.id,
        quotationId: '',
        customerId: '',
        customerName: c.customerName || 'Doanh nghiệp',
        orgId: '',
        title: c.title,
        startDate: c.startDate,
        endDate: c.endDate,
        totalValue: 0,
        status: c.status === 'pending_sign' ? ContractStatus.PENDING_SIGNATURE : ContractStatus.ACTIVE,
        lineItems: [],
        pdfUrl: c.pdfUrl,
        createdAt: '',
        updatedAt: '',
      });
    }
  };

  const handleLoadTimeline = async (contractId: string): Promise<ContractTimelineEvent[]> => {
    try {
      const res = await fetch(`/api/contracts/${contractId}/timeline`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data?.events)) {
        return data.data.events;
      }
      return [];
    } catch {
      return [];
    }
  };

  const handleModalRenew = async (contract: Contract, newEndDate: string) => {
    try {
      const res = await fetch(`/api/contracts/${contract.id}/renew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEndDate }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gia hạn thất bại');
      }
      toast.success('Hợp đồng đã được gia hạn thành công!');
      setSelectedContractForDetail(null);
      await fetchContracts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gia hạn hợp đồng thất bại');
      throw err;
    }
  };

  const handleDownload = (c: ContractItem) => {
    if (c.pdfUrl) {
      window.open(c.pdfUrl, '_blank');
      return;
    }
    const summary = `HỢP ĐỒNG: ${c.title}\nMã hợp đồng: ${c.id}\nGiá trị: ${c.value}\nThời gian: ${c.startDate} - ${c.endDate}\nTrạng thái: ${c.statusLabel}`;
    const blob = new Blob([summary], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${c.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Đã tải thông tin hợp đồng');
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Quản lý Hợp đồng</h1>
          <p className="text-sm text-gray-500 mt-1">Theo dõi các hợp đồng cung cấp dịch vụ, SLA và thời hạn hiệu lực</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto">
        {contractTabs.map((tab) => {
          const count = tab.key === 'all' ? contracts.length : tabCounts[tab.key];
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.key ? 'bg-white text-[#0f172a] shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.key ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Contract List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-16 text-center text-gray-400 bg-white rounded-xl border border-gray-100">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
            Đang tải danh sách hợp đồng...
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="file"
            title="Không có hợp đồng"
            description={
              activeTab !== 'all'
                ? 'Không có hợp đồng nào phù hợp với bộ lọc này.'
                : 'Doanh nghiệp của bạn hiện chưa có hợp đồng dịch vụ nào.'
            }
            actionLabel={activeTab !== 'all' ? 'Xem tất cả' : undefined}
            onAction={activeTab !== 'all' ? () => setActiveTab('all') : undefined}
          />
        ) : (
          filtered.map((c) => (
            <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:border-gray-300 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-gray-500 text-sm font-semibold">#{c.id.slice(-8)}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.statusColor}`}>{c.statusLabel}</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{c.typeLabel}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-base">{c.title}</h3>
                </div>
                <span className="text-lg font-bold text-gray-900 whitespace-nowrap">{c.value}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 text-sm bg-gray-50/60 p-3 rounded-lg border border-gray-100">
                <div>
                  <p className="text-gray-500 text-xs">Ngày bắt đầu</p>
                  <p className="font-medium text-gray-800">{c.startDate}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Ngày kết thúc</p>
                  <p className="font-medium text-gray-800">{c.endDate}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Trạng thái ký kết</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs font-medium ${c.signedByUs ? 'text-green-600' : 'text-gray-400'}`}>
                      {c.signedByUs ? '✅' : '⬜'} Khách hàng
                    </span>
                    <span className={`text-xs font-medium ${c.signedByProvider ? 'text-green-600' : 'text-amber-600'}`}>
                      {c.signedByProvider ? '✅' : '⏳'} Nhà cung cấp
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                <button
                  onClick={() => handleOpenDetail(c)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Eye className="w-4 h-4 text-gray-500" /> Xem chi tiết
                </button>
                {c.status === 'expiring' && (
                  <button
                    onClick={() => setSelectedContractForRenew(c)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors shadow-sm"
                  >
                    <RefreshCw className="w-4 h-4" /> Yêu cầu gia hạn
                  </button>
                )}
                {c.status === 'pending_sign' && (
                  <button
                    onClick={() => setSelectedContractForSign(c)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    ✍️ Ký điện tử
                  </button>
                )}
                <button
                  onClick={() => handleDownload(c)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Download className="w-4 h-4 text-gray-500" /> Tải về
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Contract Detail Modal */}
      <ContractDetailModal
        open={Boolean(selectedContractForDetail)}
        contract={selectedContractForDetail}
        onClose={() => setSelectedContractForDetail(null)}
        onLoadTimeline={handleLoadTimeline}
        onRenew={handleModalRenew}
      />

      {/* Digital Signature Modal */}
      <SignContractModal
        open={Boolean(selectedContractForSign)}
        contract={selectedContractForSign}
        onClose={() => setSelectedContractForSign(null)}
        onSuccess={fetchContracts}
      />

      {/* Contract Renewal Modal */}
      <RenewContractModal
        open={Boolean(selectedContractForRenew)}
        contract={selectedContractForRenew}
        onClose={() => setSelectedContractForRenew(null)}
        onSuccess={fetchContracts}
      />
    </div>
  );
}
