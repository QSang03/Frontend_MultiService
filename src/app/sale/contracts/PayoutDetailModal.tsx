'use client';

import React from 'react';
import { ArrowLeft, ArrowRight, Ban, CheckCircle2, CircleAlert, CircleSlash, Clock, ExternalLink, XCircle } from 'lucide-react';
import { Button } from '@/components/ui';

type PayoutEntry = {
  id: string;
  amount?: string;
  status?: number;
  note?: string;
  rejectionReason?: string;
  proofImageUrl?: string;
  saleName?: string;
  createdAt?: string;
  updatedAt?: string;
};

interface PayoutDetailModalProps {
  open: boolean;
  onClose: () => void;
  detail: PayoutEntry | null;
  hasPrevious?: boolean;
  hasNext?: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
  onRequestCancel?: (payoutId: string) => void;
  transitionDirection?: 'previous' | 'next' | null;
}

function parseMoney(value?: string): number {
  const normalized = String(value ?? '0').replace(/[^\d.-]/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function formatDate(value?: string): string {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function renderStatus(status?: number) {
  switch (Number(status)) {
    case 1:
      return <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700"><Clock className="h-3.5 w-3.5" />Pending</span>;
    case 2:
      return <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" />Approved</span>;
    case 3:
      return <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700"><CircleAlert className="h-3.5 w-3.5" />Rejected</span>;
    case 4:
      return <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700"><Ban className="h-3.5 w-3.5" />Cancelled</span>;
    default:
      return <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700"><CircleSlash className="h-3.5 w-3.5" />Unknown</span>;
  }
}

export default function PayoutDetailModal({
  open,
  onClose,
  detail,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
  onRequestCancel,
  transitionDirection,
}: PayoutDetailModalProps) {
  if (!open) return null;
  const transitionClass = transitionDirection === 'previous'
    ? 'animate-in fade-in slide-in-from-left-2 duration-200'
    : 'animate-in fade-in slide-in-from-right-2 duration-200';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-labelledby="payout-detail-title" className="relative h-[100dvh] w-full overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-w-xl sm:rounded-xl">
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <h3 id="payout-detail-title" className="text-xl font-bold text-gray-900">Chi tiết payout request</h3>
            <p className="mt-1 text-sm text-gray-500">Theo dõi trạng thái xử lý và thông tin đối soát chi tiết.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        {detail ? (
          <div className="flex max-h-[calc(100dvh-88px)] flex-col sm:max-h-[85vh]">
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-6 py-3">
              <div className="text-xs text-gray-500">Di chuyển nhanh giữa các payout request đang hiển thị</div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={onPrevious} disabled={!hasPrevious}>
                  <ArrowLeft className="h-4 w-4" />
                  Trước
                </Button>
                <Button variant="outline" size="sm" onClick={onNext} disabled={!hasNext}>
                  Sau
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div key={detail.id} className={`space-y-5 overflow-y-auto px-6 py-6 ${transitionClass}`}>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Request ID</p>
                <p className="mt-2 text-sm font-semibold text-gray-900">{detail.id}</p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Amount</p>
                  <p className="mt-2 text-lg font-bold text-gray-900">{formatCurrency(parseMoney(detail.amount))}</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Status</p>
                  <div className="mt-2">{renderStatus(detail.status)}</div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Note</p>
                <p className="mt-2 text-sm text-gray-700">{detail.note || 'Không có ghi chú'}</p>
              </div>

              {detail.rejectionReason ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-rose-700">Rejection reason</p>
                  <p className="mt-2 text-sm text-rose-800">{detail.rejectionReason}</p>
                </div>
              ) : null}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-gray-200 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Created at</p>
                  <p className="mt-2 text-sm font-medium text-gray-900">{formatDate(detail.createdAt)}</p>
                </div>
                <div className="rounded-xl border border-gray-200 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Updated at</p>
                  <p className="mt-2 text-sm font-medium text-gray-900">{formatDate(detail.updatedAt)}</p>
                </div>
              </div>

              {detail.proofImageUrl ? (
                <a href={detail.proofImageUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline">
                  Xem chứng từ thanh toán
                  <ExternalLink className="h-4 w-4" />
                </a>
              ) : null}

              <div className="hidden items-center justify-end gap-2 pb-2 sm:flex">
                {Number(detail.status) === 1 && onRequestCancel ? (
                  <Button variant="danger" onClick={() => onRequestCancel(detail.id)}>
                    Hủy request này
                  </Button>
                ) : null}
                <Button variant="outline" onClick={onClose}>Đóng</Button>
              </div>
            </div>

            <div className="sticky bottom-0 z-20 border-t border-gray-100 bg-white/95 px-4 py-3 backdrop-blur-sm sm:hidden">
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" size="sm" onClick={onPrevious} disabled={!hasPrevious}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                {Number(detail.status) === 1 && onRequestCancel ? (
                  <Button variant="danger" size="sm" onClick={() => onRequestCancel(detail.id)}>
                    Hủy
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={onClose}>Đóng</Button>
                )}
                <Button variant="outline" size="sm" onClick={onNext} disabled={!hasNext}>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-sm text-gray-500">Không tìm thấy chi tiết payout.</div>
        )}
      </div>
    </div>
  );
}
