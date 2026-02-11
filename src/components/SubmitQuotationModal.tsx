'use client';

import React, { useState } from 'react';
import { X, Loader2, DollarSign } from 'lucide-react';

interface SubmitQuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  ticketId: string;
  ticketTitle?: string;
}

interface QuotationItem {
  name: string;
  quantity: number;
  unitPrice: string;
  total: string;
}

export default function SubmitQuotationModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  ticketId,
  ticketTitle 
}: SubmitQuotationModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [items, setItems] = useState<QuotationItem[]>([
    { name: '', quantity: 1, unitPrice: '0', total: '0' }
  ]);
  const [taxAmount, setTaxAmount] = useState('0');
  const [currency, setCurrency] = useState('VND');
  const [note, setNote] = useState('');

  const calculateItemTotal = (quantity: number, unitPrice: string): string => {
    const price = parseFloat(unitPrice) || 0;
    return (quantity * price).toFixed(0);
  };

  const calculateTotalAmount = (): string => {
    const itemsTotal = items.reduce((sum, item) => {
      return sum + (parseFloat(item.total) || 0);
    }, 0);
    return itemsTotal.toFixed(0);
  };

  const calculateGrandTotal = (): string => {
    const total = parseFloat(calculateTotalAmount()) || 0;
    const tax = parseFloat(taxAmount) || 0;
    return (total + tax).toFixed(0);
  };

  const addItem = () => {
    setItems([...items, { name: '', quantity: 1, unitPrice: '0', total: '0' }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof QuotationItem, value: string | number) => {
    const newItems = [...items];
    if (field === 'quantity') {
      newItems[index].quantity = Number(value) || 0;
    } else if (field === 'unitPrice') {
      newItems[index].unitPrice = value as string;
    } else if (field === 'name') {
      newItems[index].name = value as string;
    }
    // Recalculate total
    newItems[index].total = calculateItemTotal(newItems[index].quantity, newItems[index].unitPrice);
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/tickets/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id: ticketId,
          total_amount: calculateTotalAmount(),
          tax_amount: taxAmount,
          currency,
          note,
          items: JSON.stringify(items),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit quotation');
      }

      onSuccess();
      onClose();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit quotation');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setItems([{ name: '', quantity: 1, unitPrice: '0', total: '0' }]);
    setTaxAmount('0');
    setCurrency('VND');
    setNote('');
    setError(null);
  };

  const formatCurrency = (value: string) => {
    const num = parseFloat(value) || 0;
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/10 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Submit Quotation</h3>
              {ticketTitle && (
                <p className="text-sm text-gray-500">For: {ticketTitle}</p>
              )}
            </div>
          </div>
          <button
            onClick={() => { onClose(); resetForm(); }}
            className="text-gray-400 hover:text-gray-600 transition-colors bg-gray-100 hover:bg-gray-200 p-1 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Items Table */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quotation Items
            </label>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Item</th>
                    <th className="px-3 py-2 text-center font-medium text-gray-600 w-20">Qty</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-600 w-32">Unit Price</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-600 w-32">Total</th>
                    <th className="px-3 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index} className="border-t border-gray-100">
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateItem(index, 'name', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Item name"
                          required
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-200 rounded text-sm text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                          min="1"
                          required
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-200 rounded text-sm text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                          min="0"
                          required
                        />
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-gray-900">
                        {formatCurrency(item.total)}
                      </td>
                      <td className="px-3 py-2">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              onClick={addItem}
              className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              + Add Item
            </button>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">{formatCurrency(calculateTotalAmount())} {currency}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Tax:</span>
              <input
                type="number"
                value={taxAmount}
                onChange={(e) => setTaxAmount(e.target.value)}
                className="w-32 px-2 py-1 border border-gray-200 rounded text-sm text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                min="0"
              />
            </div>
            <div className="flex justify-between text-base pt-2 border-t border-gray-200">
              <span className="font-medium text-gray-900">Grand Total:</span>
              <span className="font-bold text-green-600">{formatCurrency(calculateGrandTotal())} {currency}</span>
            </div>
          </div>

          {/* Currency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="VND">VND - Vietnamese Dong</option>
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
            </select>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Note
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Additional notes for the customer..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => { onClose(); resetForm(); }}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Submit Quotation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
