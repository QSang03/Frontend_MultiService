'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileText, 
  Calendar, 
  User, 
  Building2, 
  PenTool, 
  RefreshCw, 
  XCircle, 
  CheckCircle,
  ExternalLink,
  Download
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import type { Contract } from '@/types/contract';
import { ContractStatus, contractStatusToString } from '@/types/contract';

interface ContractDetailModalProps {
  open: boolean;
  contract: Contract | null;
  onClose: () => void;
  onSendForSignature?: (contract: Contract) => Promise<void>;
  onActivate?: (contract: Contract) => Promise<void>;
  onCancel?: (contract: Contract, reason: string) => Promise<void>;
  onRenew?: (contract: Contract, newEndDate: string) => Promise<void>;
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

export default function ContractDetailModal({
  open,
  contract,
  onClose,
  onSendForSignature,
  onActivate,
  onCancel,
  onRenew,
}: ContractDetailModalProps) {
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [showRenewForm, setShowRenewForm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setShowCancelForm(false);
      setShowRenewForm(false);
      setCancelReason('');
      setNewEndDate('');
    }
  }, [open]);

  if (!open || !contract) return null;

  const statusStr = contractStatusToString(contract.status as ContractStatus);

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

  const handleCancel = async () => {
    if (!onCancel || !cancelReason.trim()) return;
    setActionLoading(true);
    try {
      await onCancel(contract, cancelReason);
      setShowCancelForm(false);
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
            <StatusBadge status={contract.status as ContractStatus} />
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
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
                <p className="font-medium truncate">{contract.customerName || '-'}</p>
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
                  <span className="text-gray-500">Created:</span>
                  <span className="ml-2 font-medium">{contract.createdAt}</span>
                </div>
                {contract.signedAt && (
                  <div>
                    <span className="text-gray-500">Signed At:</span>
                    <span className="ml-2 font-medium">{contract.signedAt}</span>
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
                          <td className="px-4 py-3 text-right">{item.unitPrice.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right font-medium">
                            {item.totalPrice.toLocaleString()}
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

          {/* Cancel Form */}
          {showCancelForm && (
            <Card className="border-red-200">
              <CardBody className="p-6">
                <h3 className="font-semibold text-red-700 mb-4">Cancel Contract</h3>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Enter cancellation reason..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                />
                <div className="flex justify-end gap-3 mt-4">
                  <Button variant="outline" size="sm" onClick={() => setShowCancelForm(false)}>
                    Cancel
                  </Button>
                  <Button 
                    variant="danger" 
                    size="sm" 
                    onClick={handleCancel}
                    isLoading={actionLoading}
                    disabled={!cancelReason.trim()}
                  >
                    Confirm Cancellation
                  </Button>
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
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center px-6 py-4 border-t bg-gray-50">
          <div className="flex gap-2">
            {/* Cancel action - only for Draft or Pending Signature */}
            {(statusStr === 'Draft' || statusStr === 'Pending Signature') && onCancel && !showCancelForm && (
              <Button 
                variant="outline" 
                size="sm" 
                leftIcon={<XCircle className="w-4 h-4" />}
                onClick={() => setShowCancelForm(true)}
              >
                Cancel Contract
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            {/* Send for Signature - only for Draft */}
            {statusStr === 'Draft' && onSendForSignature && (
              <Button
                size="sm"
                leftIcon={<PenTool className="w-4 h-4" />}
                onClick={handleSendForSignature}
                isLoading={actionLoading}
              >
                Send for Signature
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
                Activate Contract
              </Button>
            )}

            {/* Renew - only for Expired */}
            {statusStr === 'Expired' && onRenew && !showRenewForm && (
              <Button
                size="sm"
                leftIcon={<RefreshCw className="w-4 h-4" />}
                onClick={() => setShowRenewForm(true)}
              >
                Renew Contract
              </Button>
            )}

            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
