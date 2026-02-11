'use client';

import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui';
import CreateInvoiceModal from './CreateInvoiceModal';

interface Invoice {
  id: string;
  client: string;
  amount: number;
  dueDate: string;
  status: string;
}

// Dummy data
const INITIAL_INVOICES: Invoice[] = [
  { id: 'INV-2024-001', client: 'TechSolutions Ltd', amount: 50000000, dueDate: '2024-02-15', status: 'pending_verification' },
  { id: 'INV-2024-002', client: 'Nguyen Van A', amount: 1500000, dueDate: '2024-01-25', status: 'paid' },
  { id: 'INV-2024-003', client: 'StartUp Alpha', amount: 12000000, dueDate: '2024-02-01', status: 'overdue' },
];

export default function RevenuePage() {
  const [invoices, setInvoices] = useState(INITIAL_INVOICES);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Paid
          </span>
        );
      case 'pending_verification':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            <Clock className="w-3.5 h-3.5" />
            Verify Slip
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <AlertCircle className="w-3.5 h-3.5" />
            Overdue
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
             {status}
          </span>
        );
    }
  };

  const getAction = (status: string) => {
    switch(status) {
      case 'pending_verification':
        return <button className="text-blue-600 hover:text-blue-700 text-sm font-medium hover:underline">Verify Slip</button>;
      case 'overdue':
        return <button className="text-red-600 hover:text-red-700 text-sm font-medium hover:underline">Send Reminder</button>;
      default:
        return <button className="text-gray-500 hover:text-gray-700 text-sm font-medium hover:underline">View</button>;
    }
  };

  const handleCreateSuccess = (newInvoice: Invoice) => {
    setInvoices([newInvoice, ...invoices]);
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    inv.client.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments & Invoices</h1>
          <p className="text-gray-500 text-sm mt-1">
            Track collections, verify manual transfers, and manage invoicing.
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pending Verification */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
          <p className="text-gray-500 text-sm font-medium mb-2">Pending Verification</p>
          <h3 className="text-3xl font-bold text-yellow-600">50.000.000 ₫</h3>
          <p className="text-xs text-gray-400 mt-2">1 Invoice awaiting slip check</p>
        </div>

        {/* Overdue Debt */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300 delay-75">
          <p className="text-gray-500 text-sm font-medium mb-2">Overdue Debt</p>
          <h3 className="text-3xl font-bold text-red-600">12.000.000 ₫</h3>
          <p className="text-xs text-gray-400 mt-2">Needs immediate follow-up</p>
        </div>

        {/* Collected This Month */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300 delay-150">
          <p className="text-gray-500 text-sm font-medium mb-2">Collected this Month</p>
          <h3 className="text-3xl font-bold text-green-600">1.500.000 ₫</h3>
          <p className="text-xs text-gray-400 mt-2">Keep it up!</p>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search invoice # or client..." 
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors">
            <Filter className="w-4 h-4" />
            Filter Status
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-medium uppercase text-xs">
              <tr>
                <th className="px-6 py-4">Invoice ID</th>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4">Due Date</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{inv.id}</td>
                    <td className="px-6 py-4 text-gray-600">{inv.client}</td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900">
                      {formatCurrency(inv.amount)}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{inv.dueDate}</td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(inv.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {getAction(inv.status)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    No invoices found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CreateInvoiceModal 
        open={showCreateModal} 
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
