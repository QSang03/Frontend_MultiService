'use client';

import React, { useState } from 'react';
import { X, CreditCard, Banknote } from 'lucide-react';
import { Button, Input } from '@/components/ui';

interface Invoice {
  id: string;
  client: string;
  amount: number;
  dueDate: string;
  status: string;
  method: string;
}

interface CreateInvoiceModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (invoice: Invoice) => void;
}

export default function CreateInvoiceModal({ open, onClose, onSuccess }: CreateInvoiceModalProps) {
  const [formData, setFormData] = useState({
    contractId: '',
    amount: '',
    dueDate: '',
    method: 'bank_transfer' // 'bank_transfer' | 'cash'
  });
  const [isLoading, setIsLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      const newInvoice: Invoice = {
        id: `INV-2024-${Math.floor(Math.random() * 1000)}`,
        client: formData.contractId || 'Unknown Client',
        amount: parseFloat(formData.amount.replace(/[^0-9.-]+/g, "")) || 0, // Simple parsing
        dueDate: formData.dueDate,
        status: 'pending', // default status
        method: formData.method
      };

      onSuccess(newInvoice);
      setIsLoading(false);
      onClose();
      // Reset form
      setFormData({
        contractId: '',
        amount: '',
        dueDate: '',
        method: 'bank_transfer'
      });
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Create Invoice</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Select Contract/Quote */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Select Quote / Contract</label>
            <select
              className="w-full h-10 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              value={formData.contractId}
              onChange={(e) => setFormData({...formData, contractId: e.target.value})}
              required
            >
              <option value="">Select a contract or quote...</option>
              <option value="TechSolutions Ltd">Q-2024-001 (TechSolutions Ltd)</option>
              <option value="Nguyen Van A">Q-2024-002 (Nguyen Van A)</option>
              <option value="StartUp Alpha">Q-2024-003 (StartUp Alpha)</option>
            </select>
          </div>

          {/* Amount */}
          <Input
            label="Invoice Amount"
            placeholder="e.g. 50,000,000"
            value={formData.amount}
            onChange={(e) => setFormData({...formData, amount: e.target.value})}
            required
          />

          {/* Due Date */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Due Date</label>
            <input
              type="date"
              className="w-full h-10 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.dueDate}
              onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
              required
            />
          </div>

          {/* Payment Method */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">Payment Method</label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`
                flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                ${formData.method === 'bank_transfer' 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'}
              `}>
                <input
                  type="radio"
                  name="payment_method"
                  value="bank_transfer"
                  checked={formData.method === 'bank_transfer'}
                  onChange={(e) => setFormData({...formData, method: e.target.value})}
                  className="hidden"
                />
                <CreditCard className="w-5 h-5" />
                <span className="text-sm font-medium">Bank Transfer</span>
              </label>

              <label className={`
                flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                ${formData.method === 'cash' 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'}
              `}>
                <input
                  type="radio"
                  name="payment_method"
                  value="cash"
                  checked={formData.method === 'cash'}
                  onChange={(e) => setFormData({...formData, method: e.target.value})}
                  className="hidden"
                />
                <Banknote className="w-5 h-5" />
                <span className="text-sm font-medium">Cash</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Generate Invoice
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
