'use client';

import React from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, FileText, Ticket, XCircle } from 'lucide-react';
import { Button } from '@/components/ui';

type TicketDetail = {
  ticketId?: string;
  subject?: string;
  description?: string;
  categoryName?: string;
  status?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  totalServiceValue?: string;
  createdAt?: string;
  closedAt?: string;
};

type ContractDetail = {
  contractId?: string;
  contractNumber?: string;
  title?: string;
  status?: string;
};

type CommissionDetail = {
  id: string;
  amount?: string;
  baseProfit?: string;
  rateApplied?: string;
  status?: string;
  targetType?: string;
  targetId?: string;
  detail?: {
    case?: 'ticket' | 'contract';
    value?: TicketDetail | ContractDetail;
  };
};

interface CommissionDetailModalProps {
  open: boolean;
  onClose: () => void;
  detail: CommissionDetail | null;
  isLoading?: boolean;
  hasPrevious?: boolean;
  hasNext?: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
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
  }).format(date);
}

export default function CommissionDetailModal({
  open,
  onClose,
  detail,
  isLoading,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
  transitionDirection,
}: CommissionDetailModalProps) {
  if (!open) return null;

  const ticketDetail = detail?.detail?.case === 'ticket' ? detail.detail.value as TicketDetail : null;
  const contractDetail = detail?.detail?.case === 'contract' ? detail.detail.value as ContractDetail : null;
  const targetHref = detail?.detail?.case === 'ticket'
    ? `/sale/support?ticketId=${encodeURIComponent(ticketDetail?.ticketId || detail?.targetId || '')}`
    : detail?.detail?.case === 'contract'
      ? `/sale/contracts?contractId=${encodeURIComponent(contractDetail?.contractId || detail?.targetId || '')}`
      : null;
  const transitionClass = transitionDirection === 'previous'
    ? 'animate-in fade-in slide-in-from-left-2 duration-200'
    : 'animate-in fade-in slide-in-from-right-2 duration-200';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="commission-detail-title"
        className="relative h-[100dvh] w-full overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-w-2xl sm:rounded-xl"
      >
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <h3 id="commission-detail-title" className="text-xl font-bold text-gray-900">Chi tiết commission</h3>
            <p className="mt-1 text-sm text-gray-500">Drill-down theo commission entry để xem nguồn ticket hoặc contract.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="px-6 py-12 text-center text-sm text-gray-500">Đang tải chi tiết commission...</div>
        ) : detail ? (
          <div className="flex max-h-[calc(100dvh-88px)] flex-col sm:max-h-[85vh]">
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-6 py-3">
              <div className="text-xs text-gray-500">
                Di chuyển nhanh giữa các commission đang hiển thị
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={onPrevious} disabled={!hasPrevious || isLoading}>
                  <ArrowLeft className="h-4 w-4" />
                  Trước
                </Button>
                <Button variant="outline" size="sm" onClick={onNext} disabled={!hasNext || isLoading}>
                  Sau
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div key={detail.id} className={`space-y-6 overflow-y-auto px-6 py-6 ${transitionClass}`}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Amount</p>
                <p className="mt-2 text-lg font-bold text-gray-900">{formatCurrency(parseMoney(detail.amount))}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Net Profit Base</p>
                <p className="mt-2 text-lg font-bold text-gray-900">{formatCurrency(parseMoney(detail.baseProfit))}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Rate / Status</p>
                <p className="mt-2 text-lg font-bold text-gray-900">{detail.rateApplied || 'N/A'}</p>
                <p className="mt-1 text-sm text-gray-500">{detail.status || 'Unknown'}</p>
              </div>
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-blue-700">Source</p>
                  <p className="mt-2 text-base font-semibold text-blue-950">{detail.targetType || 'Reference'} • {detail.targetId || 'N/A'}</p>
                </div>
                {targetHref ? (
                  <a href={targetHref} className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:text-blue-800 hover:underline">
                    Mở nguồn gốc
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                ) : null}
              </div>
            </div>

            {ticketDetail ? (
              <div className="rounded-xl border border-gray-200 p-5">
                <div className="mb-4 flex items-center gap-2 text-gray-900">
                  <Ticket className="h-5 w-5 text-blue-600" />
                  <h4 className="font-semibold">Ticket Metadata</h4>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Subject</p>
                    <p className="mt-1 text-sm font-medium text-gray-900">{ticketDetail.subject || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Category / Status</p>
                    <p className="mt-1 text-sm font-medium text-gray-900">{ticketDetail.categoryName || 'N/A'} • {ticketDetail.status || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Customer</p>
                    <p className="mt-1 text-sm font-medium text-gray-900">{ticketDetail.customerName || 'N/A'}</p>
                    <p className="text-sm text-gray-500">{ticketDetail.customerEmail || 'N/A'} • {ticketDetail.customerPhone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Service Value</p>
                    <p className="mt-1 text-sm font-medium text-gray-900">{formatCurrency(parseMoney(ticketDetail.totalServiceValue))}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Created</p>
                    <p className="mt-1 text-sm font-medium text-gray-900">{formatDate(ticketDetail.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Closed</p>
                    <p className="mt-1 text-sm font-medium text-gray-900">{formatDate(ticketDetail.closedAt)}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Description</p>
                  <p className="mt-1 text-sm leading-6 text-gray-700">{ticketDetail.description || 'Không có mô tả.'}</p>
                </div>
              </div>
            ) : null}

            {contractDetail ? (
              <div className="rounded-xl border border-gray-200 p-5">
                <div className="mb-4 flex items-center gap-2 text-gray-900">
                  <FileText className="h-5 w-5 text-emerald-600" />
                  <h4 className="font-semibold">Contract Metadata</h4>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Contract Number</p>
                    <p className="mt-1 text-sm font-medium text-gray-900">{contractDetail.contractNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Status</p>
                    <p className="mt-1 text-sm font-medium text-gray-900">{contractDetail.status || 'N/A'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Title</p>
                    <p className="mt-1 text-sm font-medium text-gray-900">{contractDetail.title || 'N/A'}</p>
                  </div>
                </div>
              </div>
            ) : null}

            {!ticketDetail && !contractDetail ? (
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                Commission entry này chưa có metadata chi tiết từ backend.
              </div>
            ) : null}

            <div className="hidden justify-end pb-2 sm:flex">
              <Button variant="outline" onClick={onClose}>Đóng</Button>
            </div>
          </div>

            <div className="sticky bottom-0 z-20 border-t border-gray-100 bg-white/95 px-4 py-3 backdrop-blur-sm sm:hidden">
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" size="sm" onClick={onPrevious} disabled={!hasPrevious || isLoading}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={onClose}>Đóng</Button>
                <Button variant="outline" size="sm" onClick={onNext} disabled={!hasNext || isLoading}>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-sm text-gray-500">Không tìm thấy chi tiết commission.</div>
        )}
      </div>
    </div>
  );
}