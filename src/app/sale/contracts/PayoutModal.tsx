'use client';

import React from 'react';
import { DollarSign } from 'lucide-react';
import { Button } from '@/components/ui';

interface PayoutModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  amount: number;
  isLoading?: boolean;
}

export default function PayoutModal({ open, onClose, onConfirm, amount, isLoading }: PayoutModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-8 flex flex-col items-center text-center">
          {/* Icon */}
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <DollarSign className="w-8 h-8 text-blue-600" />
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Payout Request</h3>
          
          <p className="text-gray-500 text-sm mb-6">
            You are requesting a payout for your available balance.
          </p>

          <div className="text-3xl font-bold text-gray-900 mb-8">
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)}
          </div>

          <div className="flex items-center gap-3 w-full">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={onConfirm}
              isLoading={isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Confirm
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
