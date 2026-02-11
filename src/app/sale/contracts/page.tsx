'use client';

import React, { useState } from 'react';
import { 
  DollarSign, 
  Clock, 
  TrendingUp, 
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui';
import PayoutModal from './PayoutModal';

// Dummy Data
const COMMISSION_HISTORY = [
  {
    id: 1,
    description: 'Server Setup - TechSolutions',
    subtext: 'TICK-992 • Jan 2024',
    profitBase: 4000000,
    revenue: 10000000,
    rate: '10%',
    amount: 400000,
    status: 'Available',
    isClawback: false
  },
  {
    id: 2,
    description: 'Laptop Repair - Nguyen Van A',
    subtext: 'TICK-881 • Jan 2024',
    profitBase: 300000,
    revenue: 500000,
    rate: '10%',
    amount: 30000,
    status: 'Pending',
    isClawback: false
  },
  {
    id: 3,
    description: 'Customer Refund - Printer Fix',
    subtext: 'TICK-775 (Clawback) • Jan 2024',
    profitBase: -2000000,
    revenue: 0,
    rate: '10%',
    amount: -200000,
    status: 'Available',
    isClawback: true
  }
];

export default function CommissionsPage() {
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const availableBalance = 200000;
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const handlePayoutConfirm = () => {
    setIsProcessing(true);
    // Simulate API call
    setTimeout(() => {
      setIsProcessing(false);
      setShowPayoutModal(false);
      alert('Payout requested successfully!');
    }, 1500);
  };

  const getStatusBadge = (status: string) => {
    if (status === 'Available') {
      return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Available</span>;
    }
    return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">Pending</span>;
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Commissions & Performance</h1>
        <p className="text-gray-500 mt-1">
          Track Net Profit based earnings, tiers, and clawback adjustments.
        </p>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Available Balance */}
        <div className="bg-[#2442cf] rounded-xl p-6 text-white relative overflow-hidden shadow-lg">
          <div className="flex justify-between items-start mb-6 z-10 relative">
            <div>
              <p className="text-blue-100 text-sm font-medium">Available Balance</p>
              <h3 className="text-4xl font-bold mt-2">{formatCurrency(availableBalance)}</h3>
            </div>
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
          </div>
          <Button 
            onClick={() => setShowPayoutModal(true)}
            className="w-full bg-white/10 hover:bg-white/20 text-white border-0"
          >
            Request Payout
          </Button>
          
          {/* Decorative Circle */}
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
        </div>

        {/* Pending Balance */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm relative">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-gray-500 text-sm font-medium">Pending Balance</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">30.000 ₫</h3>
            </div>
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-500" />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-4">
            Moves to Available when ticket is Closed & Paid.
          </p>
        </div>

        {/* Current Tier */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-gray-500 text-sm font-medium">Current Tier: 1 (10%)</p>
              <div className="flex items-baseline gap-2 mt-2">
                <h3 className="text-3xl font-bold text-gray-900">45M</h3>
                <span className="text-gray-400 text-sm">/ 50M Profit</span>
              </div>
            </div>
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '90%' }}></div>
          </div>
          <p className="text-xs text-blue-600 font-medium">
            Just 5M more profit to reach Tier 2 (15%)!
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Commission History Table (2/3 width) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">Commission History</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 font-medium uppercase text-xs">
                <tr>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4 text-right">Net Profit Base</th>
                  <th className="px-6 py-4 text-center">Rate</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4 text-right justify-end flex">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {COMMISSION_HISTORY.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{item.description}</p>
                      <p className="text-xs text-gray-500 mt-1">{item.subtext}</p>
                      {item.isClawback && (
                        <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-medium rounded border border-red-200">
                          <AlertCircle className="w-3 h-3" /> Clawback
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-medium text-gray-900">{formatCurrency(item.profitBase)}</p>
                      <p className="text-xs text-gray-400">Rev: {formatCurrency(item.revenue)}</p>
                    </td>
                    <td className="px-6 py-4 text-center text-gray-600">{item.rate}</td>
                    <td className={`px-6 py-4 text-right font-bold ${item.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(item.amount)}
                    </td>
                    <td className="px-6 py-4 flex justify-end">
                      {getStatusBadge(item.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* How it works (1/3 width) */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 h-fit">
          <h3 className="font-bold text-gray-900 mb-6">How it works</h3>
          
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-1 bg-blue-600 rounded-full h-auto shrink-0"></div>
              <div>
                <h4 className="font-medium text-gray-900 text-sm">Net Profit Base</h4>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Commission is calculated on Net Profit (Revenue - Cost), not Total Revenue.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-1 bg-red-500 rounded-full h-auto shrink-0"></div>
              <div>
                <h4 className="font-medium text-gray-900 text-sm">Clawback Mechanism</h4>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  If profit decreases after payout (e.g., refunds, extra costs), the difference is deducted from future earnings.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <h4 className="font-medium text-gray-900 text-sm mb-3">Tier Structure</h4>
              <div className="space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Tier 1 (&lt;50M Profit)</span>
                  <span className="font-bold text-gray-900">10%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Tier 2 (50M - 150M Profit)</span>
                  <span className="font-bold text-gray-900">15%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Tier 3 (&gt;150M Profit)</span>
                  <span className="font-bold text-gray-900">20%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PayoutModal
        open={showPayoutModal}
        onClose={() => setShowPayoutModal(false)}
        onConfirm={handlePayoutConfirm}
        amount={availableBalance}
        isLoading={isProcessing}
      />
    </div>
  );
}
