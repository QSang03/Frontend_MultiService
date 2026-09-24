'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Calendar,
  User,
  Building2,
  RefreshCw,
  XCircle,
  CheckCircle,
  ExternalLink,
  Download,
  Send,
  Lock,
  Clock,
  Upload,
  Shield,
  Zap,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import type { Contract, ContractTimelineEvent } from '@/types/contract';
import { ContractStatus, contractStatusToString } from '@/types/contract';

interface ContractDetailModalProps {
  open: boolean;
  contract: Contract | null;
  onClose: () => void;
  onFinalize?: (contract: Contract) => Promise<void>;
  onSendForSignature?: (contract: Contract) => Promise<void>;
  onActivate?: (contract: Contract) => Promise<void>;
  onCancel?: (contract: Contract) => Promise<void>;
  onRenew?: (contract: Contract, newEndDate: string) => Promise<void>;
  onUploadRevised?: (contract: Contract, fileType: string, fileId: string) => Promise<void>;
  onLoadTimeline?: (contractId: string) => Promise<ContractTimelineEvent[]>;
  isLoading?: boolean;
}

// ─── helpers ────────────────────────────────────────────────
function fmtDate(value: string | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmtDatetime(value: unknown): string {
  if (!value) return '—';
  let d: Date | null = null;
  if (typeof value === 'string') d = new Date(value);
  else if (typeof value === 'number') d = new Date(value);
  else if (typeof value === 'object') {
    const obj = value as { seconds?: string | number };
    if (obj.seconds !== undefined) d = new Date(Number(obj.seconds) * 1000);
  }
  if (!d || Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function fmtCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
}

// ─── status config ───────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string }> = {
  Draft:              { label: 'Nháp',          dot: 'bg-gray-400',   badge: 'bg-gray-100 text-gray-600 ring-gray-200' },
  'Pending Signature':{ label: 'Chờ ký',        dot: 'bg-amber-400',  badge: 'bg-amber-50 text-amber-700 ring-amber-200' },
  Active:             { label: 'Đang hiệu lực', dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  Expired:            { label: 'Hết hạn',       dot: 'bg-orange-400', badge: 'bg-orange-50 text-orange-700 ring-orange-200' },
  Cancelled:          { label: 'Đã hủy',        dot: 'bg-red-400',    badge: 'bg-red-50 text-red-700 ring-red-200' },
  Renewed:            { label: 'Đã gia hạn',    dot: 'bg-purple-400', badge: 'bg-purple-50 text-purple-700 ring-purple-200' },
};

const StatusBadge = ({ status }: { status: ContractStatus }) => {
  const key = contractStatusToString(status);
  const cfg = STATUS_CONFIG[key] ?? STATUS_CONFIG['Draft'];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ${cfg.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

// ─── lifecycle ───────────────────────────────────────────────
const LIFECYCLE_STEPS = [
  { key: 'draft',   label: 'Nháp',           icon: FileText, statuses: [ContractStatus.DRAFT] },
  { key: 'pending', label: 'Chờ ký',         icon: Lock,     statuses: [ContractStatus.PENDING_SIGNATURE] },
  { key: 'active',  label: 'Đang hiệu lực',  icon: Zap,      statuses: [ContractStatus.ACTIVE] },
];

function getLifecycleIndex(status: ContractStatus): number {
  const idx = LIFECYCLE_STEPS.findIndex(s => s.statuses.includes(status));
  return idx >= 0 ? idx : -1;
}

// ─── timeline labels ─────────────────────────────────────────
const TIMELINE_LABELS: Record<string, { label: string; color: string }> = {
  CREATED:       { label: 'Tạo hợp đồng',           color: 'bg-blue-500' },
  SENT_EMAIL:    { label: 'Gửi email yêu cầu ký',   color: 'bg-indigo-500' },
  OPENED_LINK:   { label: 'Khách mở link ký',        color: 'bg-sky-500' },
  OTP_REQUESTED: { label: 'Khách yêu cầu OTP',       color: 'bg-amber-500' },
  SIGNED:        { label: 'Khách đã ký',             color: 'bg-emerald-500' },
  FINALIZED:     { label: 'Chốt hợp đồng',           color: 'bg-blue-600' },
  ACTIVATED:     { label: 'Kích hoạt hợp đồng',      color: 'bg-emerald-600' },
  CANCELLED:     { label: 'Hủy hợp đồng',            color: 'bg-red-500' },
  REVISED:       { label: 'Cập nhật file hợp đồng',  color: 'bg-purple-500' },
};

// ─── sub-components ──────────────────────────────────────────
function InfoRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500 flex-shrink-0 w-40">{label}</span>
      <span className={`text-sm font-medium text-gray-900 text-right break-all ${mono ? 'font-mono text-xs text-gray-600' : ''}`}>
        {value ?? '—'}
      </span>
    </div>
  );
}

// ─── main component ──────────────────────────────────────────
export default function ContractDetailModal({
  open,
  contract,
  onClose,
  onFinalize,
  onSendForSignature,
  onActivate,
  onCancel,
  onRenew,
  onUploadRevised,
  onLoadTimeline,
}: ContractDetailModalProps) {
  const [showRenewForm, setShowRenewForm]         = useState(false);
  const [newEndDate, setNewEndDate]               = useState('');
  const [actionLoading, setActionLoading]         = useState(false);
  const [timelineEvents, setTimelineEvents]       = useState<ContractTimelineEvent[]>([]);
  const [timelineLoading, setTimelineLoading]     = useState(false);
  const [activeTab, setActiveTab]                 = useState<'info' | 'timeline'>('info');
  const [showUploadZone, setShowUploadZone]       = useState(false);
  const [uploadFile, setUploadFile]               = useState<File | null>(null);
  const [uploadLoading, setUploadLoading]         = useState(false);
  const [uploadError, setUploadError]             = useState<string | null>(null);
  const [uploadSuccessInfo, setUploadSuccessInfo] = useState<{ name: string; sizeKb: string; fileType: string } | null>(null);
  const [loadingDownload, setLoadingDownload]     = useState(false);
  const uploadInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setShowRenewForm(false);
      setNewEndDate('');
      setActiveTab('info');
      setTimelineEvents([]);
      setShowUploadZone(false);
      setUploadFile(null);
      setUploadError(null);
      setUploadSuccessInfo(null);
    }
  }, [open]);

  useEffect(() => {
    if (activeTab === 'timeline' && contract && onLoadTimeline && timelineEvents.length === 0) {
      setTimelineLoading(true);
      onLoadTimeline(contract.id)
        .then(events => setTimelineEvents(events))
        .finally(() => setTimelineLoading(false));
    }
  }, [activeTab, contract, onLoadTimeline, timelineEvents.length]);

  if (!open || !contract) return null;

  const statusVal    = contract.status as ContractStatus;
  const statusStr    = contractStatusToString(statusVal);
  const lifecycleIdx = getLifecycleIndex(statusVal);
  const rawContract  = contract as unknown as Record<string, unknown>;
  const contractNumber = String(rawContract.contract_number ?? rawContract.contractNumber ?? '');

  // ── handlers ──
  const run = (fn: () => Promise<void>) => {
    setActionLoading(true);
    fn().finally(() => setActionLoading(false));
  };

  const handleUploadRevisedFile = async () => {
    if (!onUploadRevised || !uploadFile) return;
    setUploadLoading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      const res = await fetch('/api/sale/chat/upload', { method: 'POST', body: formData });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error((errData as { error?: string }).error || 'Upload thất bại');
      }
      const data    = await res.json() as { file_id: string };
      const ext     = uploadFile.name.split('.').pop()?.toLowerCase() || 'pdf';
      const fileType = ext === 'docx' ? 'docx' : 'pdf';
      await onUploadRevised(contract, fileType, data.file_id);
      setUploadSuccessInfo({ name: uploadFile.name, sizeKb: (uploadFile.size / 1024).toFixed(1), fileType });
      setShowUploadZone(false);
      setUploadFile(null);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Lỗi upload');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleFetchDownload = async (fileId: string) => {
    setLoadingDownload(true);
    try {
      const res  = await fetch(`/api/sale/chat/download-url?file_id=${encodeURIComponent(fileId)}`);
      const data = await res.json() as { download_url?: string };
      if (data.download_url) window.open(data.download_url, '_blank');
    } finally {
      setLoadingDownload(false);
    }
  };

  const hasDocument = contract.pdfUrl || contract.signatureUrl || contract.revisedFileId || uploadSuccessInfo;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full sm:rounded-2xl shadow-2xl sm:max-w-2xl max-h-[96dvh] sm:max-h-[90vh] flex flex-col overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-start gap-4 px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-semibold text-gray-900 truncate">
                {contract.title || '(Không có tiêu đề)'}
              </h2>
              <StatusBadge status={statusVal} />
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {contractNumber && <span className="font-mono font-medium text-gray-500">{contractNumber} · </span>}
              Tạo lúc {fmtDatetime(contract.createdAt)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Lifecycle Stepper ── */}
        {statusVal !== ContractStatus.CANCELLED && (
          <div className="px-6 py-3 bg-gray-50/70 border-b border-gray-100">
            <div className="flex items-center">
              {LIFECYCLE_STEPS.map((step, idx) => {
                const StepIcon  = step.icon;
                const done      = lifecycleIdx > idx;
                const current   = lifecycleIdx === idx;
                return (
                  <React.Fragment key={step.key}>
                    {idx > 0 && (
                      <div className={`flex-1 h-px mx-2 ${done ? 'bg-blue-400' : 'bg-gray-200'}`} />
                    )}
                    <div className="flex flex-col items-center gap-1">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all
                        ${done    ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                        : current ? 'bg-white text-blue-600 ring-2 ring-blue-500 shadow-sm'
                        :           'bg-gray-100 text-gray-400'}`}
                      >
                        {done ? <CheckCircle className="w-3.5 h-3.5" /> : <StepIcon className="w-3.5 h-3.5" />}
                      </div>
                      <span className={`text-[11px] font-medium whitespace-nowrap ${current ? 'text-blue-600' : 'text-gray-400'}`}>
                        {step.label}
                      </span>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Tabs ── */}
        <div className="flex gap-1 px-6 pt-3 pb-0 border-b border-gray-100">
          {(['info', 'timeline'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors -mb-px ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab === 'info' ? 'Thông tin' : (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Timeline
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'info' ? (
            <div className="px-6 py-5 space-y-5">

              {/* KPI row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3">
                  <p className="text-xs text-gray-400 mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> Khách hàng
                  </p>
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {contract.customerName || '—'}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3">
                  <p className="text-xs text-gray-400 mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Thời hạn
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {fmtDate(contract.startDate)} – {fmtDate(contract.endDate)}
                  </p>
                </div>
                <div className="rounded-xl border border-blue-100 bg-blue-50/40 px-4 py-3">
                  <p className="text-xs text-blue-400 mb-1 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" /> Giá trị
                  </p>
                  <p className="text-sm font-semibold text-blue-700">
                    {fmtCurrency(contract.totalValue || 0)}
                  </p>
                </div>
              </div>

              {/* Details */}
              <div className="rounded-xl border border-gray-100">
                <div className="px-4 py-3 border-b border-gray-50">
                  <h3 className="text-sm font-semibold text-gray-700">Chi tiết hợp đồng</h3>
                </div>
                <div className="px-4 divide-y divide-gray-50">
                  {contractNumber && <InfoRow label="Số hợp đồng"     value={contractNumber} />}
                  <InfoRow label="Báo giá tham chiếu" value={contract.quotationId} mono />
                  <InfoRow label="Template"           value={contract.templateName || '—'} />
                  {contract.signedAt && (
                    <InfoRow label="Ngày ký" value={fmtDatetime(contract.signedAt)} />
                  )}
                  <InfoRow label="Ngày tạo"  value={fmtDatetime(contract.createdAt)} />
                  <InfoRow label="Cập nhật"  value={fmtDatetime(contract.updatedAt)} />
                </div>
              </div>

              {/* Line items */}
              {contract.lineItems && contract.lineItems.length > 0 && (
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/60">
                    <h3 className="text-sm font-semibold text-gray-700">Dịch vụ</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-gray-400 uppercase tracking-wide">
                          <th className="px-4 py-2.5 text-left font-medium">Dịch vụ</th>
                          <th className="px-4 py-2.5 text-right font-medium">SL</th>
                          <th className="px-4 py-2.5 text-right font-medium">Đơn giá</th>
                          <th className="px-4 py-2.5 text-right font-medium">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {contract.lineItems.map((item, i) => (
                          <tr key={i} className="hover:bg-gray-50/50">
                            <td className="px-4 py-3">
                              <p className="font-medium text-gray-800">{item.serviceName || item.serviceId}</p>
                              {item.description && <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>}
                            </td>
                            <td className="px-4 py-3 text-right text-gray-600">{item.quantity}</td>
                            <td className="px-4 py-3 text-right text-gray-600">{(item.unitPrice ?? 0).toLocaleString('vi-VN')}</td>
                            <td className="px-4 py-3 text-right font-semibold text-gray-800">{(item.totalPrice ?? 0).toLocaleString('vi-VN')}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-gray-100 bg-gray-50/60">
                          <td colSpan={3} className="px-4 py-3 text-right text-sm font-medium text-gray-500">Tổng cộng</td>
                          <td className="px-4 py-3 text-right font-bold text-blue-700">{fmtCurrency(contract.totalValue || 0)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* Gia hạn form */}
              {showRenewForm && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 overflow-hidden">
                  <div className="px-4 py-3 border-b border-emerald-100">
                    <h3 className="text-sm font-semibold text-emerald-700 flex items-center gap-2">
                      <RefreshCw className="w-4 h-4" /> Gia hạn hợp đồng
                    </h3>
                  </div>
                  <div className="px-4 py-4 space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Ngày kết thúc mới</label>
                      <input
                        type="date"
                        value={newEndDate}
                        onChange={e => setNewEndDate(e.target.value)}
                        min={contract.endDate}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => setShowRenewForm(false)}>Hủy</Button>
                      <Button
                        size="sm"
                        onClick={() => run(async () => { await onRenew!(contract, newEndDate); setShowRenewForm(false); })}
                        isLoading={actionLoading}
                        disabled={!newEndDate}
                      >
                        Xác nhận gia hạn
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Documents */}
              {hasDocument && (
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/60 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-700">File hợp đồng</h3>
                    {statusStr === 'Draft' && onUploadRevised && (
                      <button
                        onClick={() => { setShowUploadZone(v => !v); setUploadFile(null); setUploadError(null); }}
                        className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        {showUploadZone ? 'Đóng' : 'Upload bản mới'}
                      </button>
                    )}
                  </div>

                  <div className="divide-y divide-gray-50">
                    {/* Immediate success feedback */}
                    {uploadSuccessInfo && (
                      <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50/60">
                        <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{uploadSuccessInfo.name}</p>
                          <p className="text-xs text-gray-400">{uploadSuccessInfo.sizeKb} KB · {uploadSuccessInfo.fileType.toUpperCase()}</p>
                        </div>
                        <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 flex-shrink-0">
                          <CheckCircle className="w-3.5 h-3.5" /> Đã upload
                        </span>
                      </div>
                    )}

                    {/* Persistent: signatureUrl (presigned from API) */}
                    {!uploadSuccessInfo && contract.signatureUrl && (
                      <div className="flex items-center gap-3 px-4 py-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4 text-blue-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800">Bản hợp đồng hiện tại</p>
                          <p className="text-xs text-gray-400">PDF · Bản sửa đổi mới nhất</p>
                        </div>
                        <a
                          href={contract.signatureUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex-shrink-0"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Xem file
                        </a>
                      </div>
                    )}

                    {/* Fallback: file ID khi không có signatureUrl */}
                    {!uploadSuccessInfo && !contract.signatureUrl && contract.revisedFileId && (
                      <div className="flex items-center gap-3 px-4 py-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4 text-blue-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800">Bản hợp đồng hiện tại</p>
                          <p className="text-xs text-gray-400 font-mono truncate">{contract.revisedFileId}</p>
                        </div>
                        <button
                          onClick={() => handleFetchDownload(contract.revisedFileId!)}
                          disabled={loadingDownload}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
                        >
                          {loadingDownload ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                          Tải xuống
                        </button>
                      </div>
                    )}

                    {contract.pdfUrl && (
                      <div className="flex items-center gap-3 px-4 py-3">
                        <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4 text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800">PDF gốc</p>
                        </div>
                        <a
                          href={contract.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
                        >
                          <Download className="w-3.5 h-3.5" /> Tải xuống
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Upload zone (inline) */}
                  {showUploadZone && (
                    <div className="px-4 pb-4 pt-2 border-t border-dashed border-blue-200 bg-blue-50/30">
                      <input
                        ref={uploadInputRef}
                        type="file"
                        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        className="hidden"
                        onChange={e => { setUploadFile(e.target.files?.[0] ?? null); setUploadError(null); }}
                      />
                      <div
                        onClick={() => uploadInputRef.current?.click()}
                        className={`mt-2 border-2 border-dashed rounded-xl px-4 py-5 text-center cursor-pointer transition-colors ${
                          uploadFile ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300 bg-white'
                        }`}
                      >
                        {uploadFile ? (
                          <div className="flex items-center justify-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <FileText className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-medium text-gray-800 truncate max-w-xs">{uploadFile.name}</p>
                              <p className="text-xs text-gray-400">{(uploadFile.size / 1024).toFixed(1)} KB</p>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <Upload className="w-6 h-6 mx-auto text-gray-300 mb-2" />
                            <p className="text-sm text-gray-500">Nhấn để chọn file <span className="font-medium text-blue-600">PDF hoặc DOCX</span></p>
                          </div>
                        )}
                      </div>
                      {uploadError && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-red-600">
                          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" /> {uploadError}
                        </div>
                      )}
                      <div className="flex justify-end gap-2 mt-3">
                        <Button variant="outline" size="sm" onClick={() => { setShowUploadZone(false); setUploadFile(null); setUploadError(null); }}>
                          Hủy
                        </Button>
                        <Button
                          size="sm"
                          leftIcon={uploadLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                          onClick={handleUploadRevisedFile}
                          isLoading={uploadLoading}
                          disabled={!uploadFile || uploadLoading}
                        >
                          Xác nhận upload
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Upload button when no documents exist yet */}
              {!hasDocument && statusStr === 'Draft' && onUploadRevised && !showUploadZone && (
                <button
                  onClick={() => setShowUploadZone(true)}
                  className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl py-4 text-sm text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors"
                >
                  <Upload className="w-4 h-4" /> Upload file hợp đồng
                </button>
              )}
              {!hasDocument && showUploadZone && (
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/60 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-700">Upload file hợp đồng</h3>
                    <button onClick={() => { setShowUploadZone(false); setUploadFile(null); setUploadError(null); }} className="text-gray-400 hover:text-gray-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="px-4 pb-4 pt-2">
                    <input
                      ref={uploadInputRef}
                      type="file"
                      accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      className="hidden"
                      onChange={e => { setUploadFile(e.target.files?.[0] ?? null); setUploadError(null); }}
                    />
                    <div
                      onClick={() => uploadInputRef.current?.click()}
                      className={`mt-2 border-2 border-dashed rounded-xl px-4 py-5 text-center cursor-pointer transition-colors ${
                        uploadFile ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300 bg-white'
                      }`}
                    >
                      {uploadFile ? (
                        <div className="flex items-center justify-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-medium text-gray-800 truncate max-w-xs">{uploadFile.name}</p>
                            <p className="text-xs text-gray-400">{(uploadFile.size / 1024).toFixed(1)} KB</p>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <Upload className="w-6 h-6 mx-auto text-gray-300 mb-2" />
                          <p className="text-sm text-gray-500">Nhấn để chọn file <span className="font-medium text-blue-600">PDF hoặc DOCX</span></p>
                        </div>
                      )}
                    </div>
                    {uploadError && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-red-600">
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" /> {uploadError}
                      </div>
                    )}
                    <div className="flex justify-end gap-2 mt-3">
                      <Button variant="outline" size="sm" onClick={() => { setShowUploadZone(false); setUploadFile(null); setUploadError(null); }}>Hủy</Button>
                      <Button
                        size="sm"
                        leftIcon={uploadLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                        onClick={handleUploadRevisedFile}
                        isLoading={uploadLoading}
                        disabled={!uploadFile || uploadLoading}
                      >
                        Xác nhận upload
                      </Button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          ) : (
            /* ── Timeline ── */
            <div className="px-6 py-5">
              {timelineLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <p className="text-sm">Đang tải timeline…</p>
                </div>
              ) : timelineEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-400">
                  <Clock className="w-8 h-8 opacity-30" />
                  <p className="text-sm">Chưa có sự kiện nào</p>
                </div>
              ) : (
                <div className="space-y-0">
                  {timelineEvents.map((evt, idx) => {
                    const cfg = TIMELINE_LABELS[evt.action] ?? { label: evt.action, color: 'bg-gray-400' };
                    const isLast = idx === timelineEvents.length - 1;
                    return (
                      <div key={idx} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1 ${cfg.color}`} />
                          {!isLast && <div className="w-px flex-1 bg-gray-150 my-1 min-h-[20px] bg-gray-200" />}
                        </div>
                        <div className={`flex-1 ${isLast ? 'pb-0' : 'pb-4'}`}>
                          <p className="text-sm font-medium text-gray-800">{cfg.label}</p>
                          {evt.createdAt && (
                            <p className="text-xs text-gray-400 mt-0.5">{fmtDatetime(evt.createdAt)}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer Actions ── */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/60">
          {/* Destructive on the left */}
          <div>
            {(statusStr === 'Draft' || statusStr === 'Pending Signature') && onCancel && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<XCircle className="w-3.5 h-3.5" />}
                onClick={() => run(() => onCancel!(contract))}
                isLoading={actionLoading}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                Hủy HĐ
              </Button>
            )}
          </div>

          {/* Primary actions on the right */}
          <div className="flex items-center gap-2">
            {statusStr === 'Draft' && onFinalize && (
              <Button size="sm" variant="outline" leftIcon={<Shield className="w-3.5 h-3.5" />} onClick={() => run(() => onFinalize!(contract))} isLoading={actionLoading}>
                Chốt HĐ
              </Button>
            )}
            {statusStr === 'Draft' && onUploadRevised && !showUploadZone && hasDocument && (
              <Button size="sm" variant="outline" leftIcon={<Upload className="w-3.5 h-3.5" />} onClick={() => { setShowUploadZone(true); setUploadFile(null); setUploadError(null); }}>
                Upload bản mới
              </Button>
            )}
            {statusStr === 'Draft' && onSendForSignature && (
              <Button size="sm" leftIcon={<Send className="w-3.5 h-3.5" />} onClick={() => run(() => onSendForSignature!(contract))} isLoading={actionLoading}>
                Gửi yêu cầu ký
              </Button>
            )}
            {statusStr === 'Pending Signature' && contract.signedAt && onActivate && (
              <Button size="sm" leftIcon={<CheckCircle className="w-3.5 h-3.5" />} onClick={() => run(() => onActivate!(contract))} isLoading={actionLoading}>
                Kích hoạt
              </Button>
            )}
            {statusStr === 'Expired' && onRenew && !showRenewForm && (
              <Button size="sm" leftIcon={<RefreshCw className="w-3.5 h-3.5" />} onClick={() => setShowRenewForm(true)}>
                Gia hạn
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onClose}>
              Đóng
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
