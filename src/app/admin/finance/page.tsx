'use client';

import React, { useState } from 'react';
import { DollarSign, TrendingUp, CreditCard, Shield, AlertCircle, ArrowRight, Calendar, Activity } from 'lucide-react';
import TopHeader from '@/components/layout/TopHeader';

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState<'profit' | 'payout' | 'riskfund'>('profit');
  const [riskFundEnabled, setRiskFundEnabled] = useState(true);
  const [deductionRate, setDeductionRate] = useState(5);

  // Mock data for profit stream
  const profitStream = [
    { id: 1, ticket: 'T-9921', description: 'Server Hardware Upgrade (SAL...', model: 'ONE-DEAL', modelColor: 'bg-blue-100 text-blue-700', date: '2025-10-12', profit: '3.000.000 đ' },
    { id: 2, ticket: 'T-9922', description: 'Monthly Maintenance - Zone B', model: 'RECURRING', modelColor: 'bg-purple-100 text-purple-700', date: '2025-11-15', profit: '1.100.000 đ' },
    { id: 3, ticket: 'T-9923', description: 'Enterprise Network Setup (Ci...', model: 'ONE-DEAL', modelColor: 'bg-blue-100 text-blue-700', date: '2025-10-18', profit: '200.000.000 đ' },
  ];

  // Mock settlement batches
  const settlementBatches = [
    { id: 1, month: 'December 2025', recipients: 24, scheduled: '2025-12-25', amount: '125.000.000 đ', status: 'Draft', statusColor: 'bg-gray-100 text-gray-700' },
    { id: 2, month: 'November 2025', recipients: 22, scheduled: '2025-11-25', amount: '118.000.000 đ', status: 'Paid', statusColor: 'bg-green-100 text-green-700' },
    { id: 3, month: 'October 2025', recipients: 20, scheduled: '2025-10-25', amount: '110.500.000 đ', status: 'Paid', statusColor: 'bg-green-100 text-green-700' },
  ];

  // Mock risk fund activities
  const riskFundActivities = [
    { id: 1, type: 'deduction', description: 'Auto-deduction (Nov 2025 Payout)', date: '2025-11-25', amount: '+450$' },
    { id: 2, type: 'compensation', description: 'Compensation: Server Crash Incident #992', date: '2025-11-10', amount: '-1200$' },
    { id: 3, type: 'deduction', description: 'Auto-deduction (Oct 2025 Payout)', date: '2025-10-25', amount: '+410$' },
    { id: 4, type: 'deduction', description: 'Auto-deduction (Sep 2025 Payout)', date: '2025-09-25', amount: '+380$' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <TopHeader 
        title="Finance & Profit"
        icon={<DollarSign className="w-6 h-6" />}
      />

      <div className="p-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Finance & Commission</h1>
          <p className="text-gray-600">Net Profit calculation, Clawback workflows, Risk Fund strategy, and Monthly Settlements.</p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('profit')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'profit'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            Profit & Clawback
          </button>
          <button
            onClick={() => setActiveTab('payout')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'payout'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <CreditCard className="w-5 h-5" />
            Payout Settlement
          </button>
          <button
            onClick={() => setActiveTab('riskfund')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'riskfund'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Shield className="w-5 h-5" />
            Risk Fund
          </button>
        </div>

        {/* Stat Cards - Same for all tabs */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Net Profit (Month)</p>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">$42,890</p>
            <p className="text-sm text-green-600 mt-1">↑ 15% vs last month</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Pending Payouts</p>
              <CreditCard className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">$12,450</p>
            <p className="text-sm text-gray-500 mt-1">24 recipients</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Risk Fund Balance</p>
              <Shield className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">$8,200</p>
            <p className="text-sm text-green-600 mt-1">↑ +5% via Deductions vs last month</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Active Clawbacks</p>
              <AlertCircle className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">$2,500</p>
            <p className="text-sm text-red-600 mt-1">↓ 3 Pending Cases vs last month</p>
          </div>
        </div>

        {/* Profit & Clawback Tab */}
        {activeTab === 'profit' && (
          <div className="grid grid-cols-3 gap-6">
            {/* Left 2/3 */}
            <div className="col-span-2 space-y-6">
              {/* Profit Calculation Engine */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Profit Calculation Engine</h2>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-700">Formula: Net Profit (SRS v3.3)</h3>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">Auto-Calculated</span>
                  </div>
                  <div className="bg-white rounded border border-gray-200 p-3 font-mono text-sm">
                    <span className="text-green-600">Net_Profit</span>
                    <span className="text-gray-700"> = </span>
                    <span className="text-blue-600">Gross_Revenue</span>
                    <span className="text-gray-700"> - [ </span>
                    <span className="text-purple-600">VAT</span>
                    <span className="text-gray-700"> * </span>
                    <span className="text-orange-600">Material_Cost (FIFO)</span>
                    <span className="text-gray-700"> + </span>
                    <span className="text-blue-600">Fixed_OpEx</span>
                    <span className="text-gray-700"> ]</span>
                  </div>
                </div>

                {/* Real-time Profit Stream */}
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Real-time Profit Stream</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Ticket</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Model</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Last Date</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Net Profit (Latest)</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profitStream.map((item) => (
                        <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="text-sm font-semibold text-blue-600">{item.ticket}</div>
                            <div className="text-xs text-gray-500">{item.description}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${item.modelColor}`}>
                              {item.model}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">{item.date}</td>
                          <td className="py-3 px-4 text-right text-sm font-semibold text-green-600">{item.profit}</td>
                          <td className="py-3 px-4 text-center">
                            <button className="p-1 text-gray-400 hover:text-gray-600">
                              <AlertCircle className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-500 text-center mt-3">* Click on row to see full financial breakdown</p>
              </div>
            </div>

            {/* Right 1/3 - Clawback Management */}
            <div className="col-span-1">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Clawback Management</h2>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-orange-900 mb-1">Clawback Alert: RMA #881</h3>
                      <p className="text-sm text-orange-800 mb-3">
                        Cost Adjustment for closed Ticket T-8812. Hardware replacement cost increased post-closure.
                      </p>
                      <div className="text-sm mb-3">
                        <span className="text-orange-700">Original Profit: </span>
                        <span className="font-semibold text-orange-900">2.000.000 đ</span>
                        <span className="text-orange-700"> • New Profit: </span>
                        <span className="font-semibold text-red-600">-500.000 đ</span>
                      </div>
                      <div className="flex gap-2">
                        <button className="flex-1 px-3 py-2 bg-orange-600 text-white text-sm font-medium rounded hover:bg-orange-700 transition-colors">
                          Approve Debt Creation
                        </button>
                        <button className="px-3 py-2 border border-orange-300 text-orange-700 text-sm font-medium rounded hover:bg-orange-50 transition-colors">
                          Audit
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Total Clawback Exposure</span>
                      <span className="text-lg font-bold text-red-600">$2,500</span>
                    </div>
                    <p className="text-xs text-gray-600">3 pending cases requiring action</p>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Recovery Rate (3M avg)</span>
                      <span className="text-lg font-bold text-blue-600">87%</span>
                    </div>
                    <p className="text-xs text-gray-600">Above target threshold (80%)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payout Settlement Tab */}
        {activeTab === 'payout' && (
          <div className="space-y-6">
            {/* Commission Lifecycle */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">COMMISSION LIFECYCLE (STATE MACHINE)</h2>

              <div className="flex items-center justify-between max-w-5xl mx-auto">
                {[
                  { stage: 1, label: 'Pending', sublabel: 'Ticket Created', active: false },
                  { stage: 2, label: 'Available', sublabel: 'Ticket Closed', active: false },
                  { stage: 3, label: 'Frozen', sublabel: 'Period Close (25th)', active: true },
                  { stage: 4, label: 'Processing', sublabel: 'Bank Transfer', active: false },
                  { stage: 5, label: 'Paid', sublabel: 'Money Received', active: false },
                ].map((item, idx) => (
                  <React.Fragment key={item.stage}>
                    <div className="flex flex-col items-center">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 mb-2 ${
                        item.active 
                          ? 'bg-blue-600 border-blue-600 text-white' 
                          : 'bg-gray-100 border-gray-300 text-gray-400'
                      }`}>
                        <span className="text-2xl font-bold">{item.stage}</span>
                      </div>
                      <p className={`font-semibold text-sm mb-1 ${item.active ? 'text-gray-900' : 'text-gray-500'}`}>
                        {item.label}
                      </p>
                      <p className="text-xs text-gray-500">{item.sublabel}</p>
                    </div>
                    {idx < 4 && (
                      <div className="flex-1 h-0.5 bg-gray-300 mx-4 mb-12"></div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Monthly Settlement Batches */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Monthly Settlement Batches</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Next scheduled run: <span className="font-semibold">Dec 25th, 2025</span>. Auto-deducts pending Clawbacks.
                  </p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  <Calendar className="w-4 h-4" />
                  Run Period Close (Manual)
                </button>
              </div>

              <div className="space-y-3">
                {settlementBatches.map((batch) => (
                  <div key={batch.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        batch.status === 'Paid' ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        <Calendar className={`w-6 h-6 ${
                          batch.status === 'Paid' ? 'text-green-600' : 'text-gray-400'
                        }`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{batch.month}</h3>
                        <p className="text-sm text-gray-600">
                          {batch.recipients} recipients • Scheduled: {batch.scheduled}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">{batch.amount}</p>
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1 ${batch.statusColor}`}>
                          {batch.status}
                        </span>
                      </div>
                      <button className="p-2 text-gray-400 hover:text-gray-600">
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Risk Fund Tab */}
        {activeTab === 'riskfund' && (
          <div className="grid grid-cols-3 gap-6">
            {/* Left 1/3 - Configuration */}
            <div className="col-span-1">
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Configuration</h2>

                {/* Status Toggle */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={riskFundEnabled} 
                        onChange={(e) => setRiskFundEnabled(e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                {/* Deduction Rate Slider */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Deduction Rate (%)</label>
                    <span className="text-lg font-bold text-blue-600">{deductionRate}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="20" 
                    step="1"
                    value={deductionRate}
                    onChange={(e) => setDeductionRate(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <p className="text-xs text-gray-600 mt-2">
                    Percentage of Net Profit deducted automatically into the Risk Fund before commission allocation.
                  </p>
                </div>

                {/* Safety Cap */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-gray-700 block mb-2">Safety Cap</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input 
                      type="text" 
                      value="100,000"
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      readOnly
                    />
                  </div>
                  <p className="text-xs text-blue-600 mt-2">
                    Fund accumulation pauses when this limit is reached.
                  </p>
                </div>
              </div>

              {/* Total Fund Balance Card */}
              <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-lg p-6 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-8 h-8" />
                  <div>
                    <p className="text-sm opacity-90">Total Fund Balance</p>
                    <p className="text-4xl font-bold">$8,200.00</p>
                  </div>
                </div>
                <button className="w-full px-4 py-3 bg-white text-indigo-700 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                  Disburse Compensation
                </button>
              </div>
            </div>

            {/* Right 2/3 - Fund Activity Log */}
            <div className="col-span-2">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Fund Activity Log</h2>
                  <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    View Full History
                  </button>
                </div>

                <div className="space-y-3">
                  {riskFundActivities.map((activity) => (
                    <div 
                      key={activity.id} 
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        activity.type === 'deduction' 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          activity.type === 'deduction' 
                            ? 'bg-green-100' 
                            : 'bg-red-100'
                        }`}>
                          {activity.type === 'deduction' ? (
                            <Activity className="w-5 h-5 text-green-600" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <h3 className={`font-semibold ${
                            activity.type === 'deduction' ? 'text-green-900' : 'text-red-900'
                          }`}>
                            {activity.description}
                          </h3>
                          <p className="text-sm text-gray-600">{activity.date}</p>
                        </div>
                      </div>
                      <div className={`text-lg font-bold ${
                        activity.type === 'deduction' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {activity.amount}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-200">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-700 mb-1">Total Deductions (3M)</p>
                    <p className="text-2xl font-bold text-green-600">+$1,240</p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg">
                    <p className="text-sm text-red-700 mb-1">Total Disbursements (3M)</p>
                    <p className="text-2xl font-bold text-red-600">-$1,200</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
