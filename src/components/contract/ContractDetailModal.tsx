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
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
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

const StatusBadge = ({ status }: { status: ContractStatus }) => {
  const statusStr = contractStatusToString(status);
  const styles: Record<string, string> = {
    Active: 'bg-green-100 text-green-700',
    'Pending Signature': 'bg-blue-100 text-blue-700',
    Expired: 'bg-orange-100 text-orange-700',
    Draft: 'bg-gray-100 text-gray-700',
    Cancelled: 'bg-red-100 text-red-700',
    Renewed: 'bg-purple-100 text-purple-700',
  };
  
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${styles[statusStr] || 'bg-gray-100 text-gray-700'}`}>
      {statusStr}
    </span>
  );
};

// UC-4 lifecycle steps
const LIFECYCLE_STEPS = [
  { key: 'draft', label: 'Nháp', icon: FileText, statuses: [ContractStatus.DRAFT] },
  { key: 'pending', label: 'Chờ ký', icon: Lock, statuses: [ContractStatus.PENDING_SIGNATURE] },
  { key: 'active', label: 'Hoạt động', icon: Zap, statuses: [ContractStatus.ACTIVE] },
];

function getLifecycleIndex(status: ContractStatus): number {
  const idx = LIFECYCLE_STEPS.findIndex(s => s.statuses.includes(status));
  return idx >= 0 ? idx : -1;
}

const timelineActionLabels: Record<string, string> = {
  CREATED: 'Tạo hợp đồng',
  SENT_EMAIL: 'Gửi email yêu cầu ký',
  OPENED_LINK: 'Khách mở link ký',
  OTP_REQUESTED: 'Khách yêu cầu OTP',
  SIGNED: 'Khách đã ký',
  FINALIZED: 'Chốt hợp đồng',
  ACTIVATED: 'Kích hoạt hợp đồng',
  CANCELLED: 'Hủy hợp đồng',
  REVISED: 'Cập nhật file hợp đồng',
};

const formatTimestamp = (value: unknown): string => {
  if (!value) return '-';
  if (typeof value === 'string') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? value : d.toLocaleString('vi-VN');
  }
  if (typeof value === 'number') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '-' : d.toLocaleString('vi-VN');
  }
  if (typeof value === 'object') {
    const obj = value as { seconds?: string | number };
    if (obj.seconds !== undefined) {
      const seconds = Number(obj.seconds);
      if (!Number.isNaN(seconds)) return new Date(seconds * 1000).toLocaleString('vi-VN');
    }
  }
  return '-';
};

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
  const [showRenewForm, setShowRenewForm] = useState(false);
  const [newEndDate, setNewEndDate] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [timelineEvents, setTimelineEvents] = useState<ContractTimelineEvent[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'timeline'>('info');

  useEffect(() => {
    if (open) {
      setShowRenewForm(false);
      setNewEndDate('');
      setActiveTab('info');
      setTimelineEvents([]);
    }
  }, [open]);

  // Load timeline when tab switches
  useEffect(() => {
    if (activeTab === 'timeline' && contract && onLoadTimeline && timelineEvents.length === 0) {
      setTimelineLoading(true);
      onLoadTimeline(contract.id)
        .then(events => setTimelineEvents(events))
        .finally(() => setTimelineLoading(false));
    }
  }, [activeTab, contract, onLoadTimeline, timelineEvents.length]);

  if (!open || !contract) return null;

  const statusVal = contract.status as ContractStatus;
  const statusStr = contractStatusToString(statusVal);
  const lifecycleIdx = getLifecycleIndex(statusVal);

  const handleFinalize = async () => {
    if (!onFinalize) return;
    setActionLoading(true);
    try {
      await onFinalize(contract);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendForSignature = async () => {
    if (!onSendForSignature) return;
    setActionLoading(true);
    try {
      await onSendForSignature(contract);
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivate = async () => {
    if (!onActivate) return;
    setActionLoading(true);
    try {
      await onActivate(contract);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRenew = async () => {
    if (!onRenew || !newEndDate) return;
    setActionLoading(true);
    try {
      await onRenew(contract, newEndDate);
      setShowRenewForm(false);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{contract.title || contract.id}</h2>
              <p className="text-sm text-gray-500">Contract ID: {contract.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={statusVal} />
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Lifecycle Stepper */}
        {statusVal !== ContractStatus.CANCELLED && (
          <div className="px-6 py-3 bg-gray-50 border-b">
            <div className="flex items-center justify-between">
              {LIFECYCLE_STEPS.map((step, idx) => {
                const StepIcon = step.icon;
                const isCompleted = lifecycleIdx > idx;
                const isCurrent = lifecycleIdx === idx;
                return (
                  <React.Fragment key={step.key}>
                    {idx > 0 && (
                      <div className={`flex-1 h-0.5 mx-2 ${isCompleted ? 'bg-blue-500' : 'bg-gray-200'}`} />
                    )}
                    <div className="flex flex-col items-center gap-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                        ${isCompleted ? 'bg-blue-500 text-white' : isCurrent ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500' : 'bg-gray-100 text-gray-400'}`}>
                        {isCompleted ? <CheckCircle className="w-4 h-4" /> : <StepIcon className="w-4 h-4" />}
                      </div>
                      <span className={`text-xs ${isCurrent ? 'font-semibold text-blue-700' : 'text-gray-500'}`}>
                        {step.label}
                      </span>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b px-6">
          <button
            onClick={() => setActiveTab('info')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'info' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Thông tin
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'timeline' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Clock className="w-3.5 h-3.5 inline mr-1" />
            Timeline
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'info' ? (
            <>
              {/* Quick Info Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardBody className="p-4 text-center">
                    <Calendar className="w-5 h-5 text-gray-400 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">Start Date</p>
                    <p className="font-medium">{contract.startDate}</p>
                  </CardBody>
                </Card>
                <Card>
                  <CardBody className="p-4 text-center">
                    <Calendar className="w-5 h-5 text-gray-400 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">End Date</p>
                    <p className="font-medium">{contract.endDate}</p>
                  </CardBody>
                </Card>
                <Card>
                  <CardBody className="p-4 text-center">
                    <User className="w-5 h-5 text-gray-400 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">Customer</p>
                    <p className="font-medium truncate">{contract.customerName || 'Unknown Customer'}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5 truncate font-mono">ID: {contract.customerId || '-'}</p>
                  </CardBody>
                </Card>
                <Card>
                  <CardBody className="p-4 text-center">
                    <Building2 className="w-5 h-5 text-gray-400 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">Total Value</p>
                    <p className="font-medium text-blue-600">
                      {(contract.totalValue || 0).toLocaleString()} VND
                    </p>
                  </CardBody>
                </Card>
              </div>

              {/* Contract Details */}
              <Card>
                <CardBody className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Contract Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Quotation Reference:</span>
                      <span className="ml-2 font-medium">{contract.quotationId}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Template:</span>
                      <span className="ml-2 font-medium">{contract.templateName || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Organization:</span>
                      <span className="ml-2 font-medium">{contract.orgId || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Customer ID:</span>
                      <span className="ml-2 font-medium break-all">{contract.customerId || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Created:</span>
                      <span className="ml-2 font-medium">{formatTimestamp(contract.createdAt)}</span>
                    </div>
                    {contract.signedAt && (
                      <div>
                        <span className="text-gray-500">Signed At:</span>
                        <span className="ml-2 font-medium">{formatTimestamp(contract.signedAt)}</span>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>

              {/* Line Items */}
              {contract.lineItems && contract.lineItems.length > 0 && (
                <Card>
                  <CardBody className="p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Line Items</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left">Service</th>
                            <th className="px-4 py-2 text-right">Qty</th>
                            <th className="px-4 py-2 text-right">Unit Price</th>
                            <th className="px-4 py-2 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {contract.lineItems.map((item, index) => (
                            <tr key={index} className="border-t">
                              <td className="px-4 py-3">
                                <div className="font-medium">{item.serviceName || item.serviceId}</div>
                                {item.description && (
                                  <div className="text-xs text-gray-500">{item.description}</div>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right">{item.quantity}</td>
                              <td className="px-4 py-3 text-right">{(item.unitPrice ?? 0).toLocaleString()}</td>
                              <td className="px-4 py-3 text-right font-medium">
                                {(item.totalPrice ?? 0).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 font-semibold">
                            <td colSpan={3} className="px-4 py-3 text-right">Total:</td>
                            <td className="px-4 py-3 text-right text-blue-600">
                              {(contract.totalValue || 0).toLocaleString()} VND
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </CardBody>
                </Card>
              )}

              {/* Renew Form */}
              {showRenewForm && (
                <Card className="border-green-200">
                  <CardBody className="p-6">
                    <h3 className="font-semibold text-green-700 mb-4">Renew Contract</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        New End Date
                      </label>
                      <input
                        type="date"
                        value={newEndDate}
                        onChange={(e) => setNewEndDate(e.target.value)}
                        min={contract.endDate}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                      />
                    </div>
                    <div className="flex justify-end gap-3 mt-4">
                      <Button variant="outline" size="sm" onClick={() => setShowRenewForm(false)}>
                        Cancel
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={handleRenew}
                        isLoading={actionLoading}
                        disabled={!newEndDate}
                      >
                        Confirm Renewal
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              )}

              {/* Document Links */}
              {(contract.pdfUrl || contract.signatureUrl) && (
                <Card>
                  <CardBody className="p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Documents</h3>
                    <div className="flex flex-wrap gap-3">
                      {contract.pdfUrl && (
                        <a
                          href={contract.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Download PDF
                        </a>
                      )}
                      {contract.signatureUrl && (
                        <a
                          href={contract.signatureUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-medium transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View Signature
                        </a>
                      )}
                    </div>
                  </CardBody>
                </Card>
              )}
            </>
          ) : (
            /* Timeline Tab */
            <Card>
              <CardBody className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Contract Timeline</h3>
                {timelineLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
                    <span className="ml-2 text-sm text-gray-500">Loading timeline...</span>
                  </div>
                ) : timelineEvents.length === 0 ? (
                  <p className="text-center text-sm text-gray-500 py-8">No timeline events yet</p>
                ) : (
                  <div className="relative pl-6">
                    <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-200" />
                    {timelineEvents.map((evt, idx) => (
                      <div key={idx} className="relative pb-6 last:pb-0">
                        <div className="absolute -left-4 w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">
                            {timelineActionLabels[evt.action] || evt.action}
                          </p>
                          {evt.actorId && (
                            <p className="text-xs text-gray-500">By: {evt.actorId}</p>
                          )}
                          {evt.createdAt && (
                            <p className="text-xs text-gray-400 mt-0.5">{formatTimestamp(evt.createdAt)}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center px-6 py-4 border-t bg-gray-50">
          <div className="flex gap-2">
            {/* Cancel action - only for Draft or Pending Signature */}
            {(statusStr === 'Draft' || statusStr === 'Pending Signature') && onCancel && (
              <Button 
                variant="outline" 
                size="sm" 
                leftIcon={<XCircle className="w-4 h-4" />}
                onClick={() => {
                  setActionLoading(true);
                  onCancel(contract).finally(() => setActionLoading(false));
                }}
                isLoading={actionLoading}
              >
                Hủy HĐ
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            {/* Finalize - only for Draft (lock the contract before sending) */}
            {statusStr === 'Draft' && onFinalize && (
              <Button
                size="sm"
                variant="outline"
                leftIcon={<Shield className="w-4 h-4" />}
                onClick={handleFinalize}
                isLoading={actionLoading}
              >
                Chốt HĐ
              </Button>
            )}

            {/* Send for Signature - only for Draft (after finalize, status becomes PENDING_SIGNATURE) */}
            {statusStr === 'Draft' && onSendForSignature && (
              <Button
                size="sm"
                leftIcon={<Send className="w-4 h-4" />}
                onClick={handleSendForSignature}
                isLoading={actionLoading}
              >
                Gửi yêu cầu ký
              </Button>
            )}

            {/* Upload revised - only for Draft */}
            {statusStr === 'Draft' && onUploadRevised && (
              <Button
                size="sm"
                variant="outline"
                leftIcon={<Upload className="w-4 h-4" />}
                onClick={() => {
                  // Trigger a simple file-id prompt (in a real app, integrate with StorageService)
                  const fileId = prompt('Nhập File ID từ StorageService:');
                  if (fileId) {
                    const fileType = prompt('Loại file (pdf/docx):', 'docx');
                    if (fileType) {
                      setActionLoading(true);
                      onUploadRevised(contract, fileType, fileId).finally(() => setActionLoading(false));
                    }
                  }
                }}
              >
                Upload bản mới
              </Button>
            )}

            {/* Activate - only for Pending Signature (after customer signed) */}
            {statusStr === 'Pending Signature' && contract.signedAt && onActivate && (
              <Button
                size="sm"
                leftIcon={<CheckCircle className="w-4 h-4" />}
                onClick={handleActivate}
                isLoading={actionLoading}
              >
                Kích hoạt
              </Button>
            )}

            {/* Renew - only for Expired */}
            {statusStr === 'Expired' && onRenew && !showRenewForm && (
              <Button
                size="sm"
                leftIcon={<RefreshCw className="w-4 h-4" />}
                onClick={() => setShowRenewForm(true)}
              >
                Gia hạn
              </Button>
            )}

            <Button variant="outline" onClick={onClose}>
              Đóng
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
