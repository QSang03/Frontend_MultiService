'use client';

import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import Button from '@/components/ui/Button';

interface CancelContractModalProps {
  open: boolean;
  contractId: string;
  contractTitle?: string;
  onClose: () => void;
  onConfirm: (contractId: string, reason: string) => Promise<void>;
  isLoading?: boolean;
}

export default function CancelContractModal({
  open,
  contractId,
  contractTitle,
  onClose,
  onConfirm,
  isLoading = false,
}: CancelContractModalProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!reason.trim()) {
      setError('Please enter a cancellation reason');
      return;
    }

    try {
      await onConfirm(contractId, reason);
      setReason('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel contract');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Cancel Contract</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              Are you sure you want to cancel this contract?
            </p>
            {contractTitle && (
              <p className="text-sm font-medium text-red-900 mt-2">
                &quot;{contractTitle}&quot;
              </p>
            )}
            <p className="text-xs text-red-600 mt-2">
              This action cannot be undone.
            </p>
          </div>

          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
              Cancellation Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter the reason for cancellation..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
              required
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Keep Contract
            </Button>
            <Button
              type="submit"
              variant="danger"
              isLoading={isLoading}
              disabled={!reason.trim()}
            >
              Cancel Contract
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
