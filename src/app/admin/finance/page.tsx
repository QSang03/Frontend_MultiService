'use client';

import React, { useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  CreditCard, 
  Shield, 
  AlertCircle, 
  ArrowRight, 
  Calendar, 
  Activity,
  Save,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import TopHeader from '@/components/layout/TopHeader';

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState<'profit' | 'payout' | 'riskfund'>('profit');
  const [riskFundEnabled, setRiskFundEnabled] = useState(true);
  const [deductionRate, setDeductionRate] = useState(5);
  const [isSavingRiskFund, setIsSavingRiskFund] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Mock data for profit stream
  const profitStream = [
    { id: 1, ticket: 'T-9921', description: 'Server Hardware Upgrade (SAL...)', model: 'ONE-DEAL', modelColor: 'bg-blue-100 text-blue-700', date: '2025-10-12', profit: '3.000.000 đ' },
    { id: 2, ticket: 'T-9922', description: 'Monthly Maintenance - Zone B', model: 'RECURRING', modelColor: 'bg-purple-100 text-purple-700', date: '2025-11-15', profit: '1.100.000 đ' },
    { id: 3, ticket: 'T-9923', description: 'Enterprise Network Setup (Ci...)', model: 'ONE-DEAL', modelColor: 'bg-blue-100 text-blue-700', date: '2025-10-18', profit: '200.000.000 đ' },
  ];

  // Carry-forward clawback debts (SRS III.4 - 30% MTD cap rule)
  const [carryForwardDebts] = useState([
    {
      id: 'CFD-01',
      saleRep: 'Nguyễn Văn A (Sale Lead)',
      ticketRef: 'T-8812 (RMA Switch Juniper)',
      totalClawback: 5000000,
      monthlyIncome: 6000000,
      cap30Percent: 1800000,
      deductedImmediate: 1800000,
      carryForwardRemaining: 3200000,
      nextPeriod: 'Kỳ tháng 03/2026',
      status: 'DEFERRED_30_CAP'
    },
    {
      id: 'CFD-02',
      saleRep: 'Trần Thị B (Senior Sale)',
      ticketRef: 'T-7619 (Part Price Adjustment)',
      totalClawback: 3500000,
      monthlyIncome: 4000000,
      cap30Percent: 1200000,
      deductedImmediate: 1200000,
      carryForwardRemaining: 2300000,
      nextPeriod: 'Kỳ tháng 03/2026',
      status: 'DEFERRED_30_CAP'
    }
  ]);

  // Mock settlement batches
  const settlementBatches = [
    { id: 1, month: 'December 2025', recipients: 24, scheduled: '2025-12-25', amount: '125.000.000 đ', status: 'Draft', statusColor: 'bg-gray-100 text-gray-700' },
    { id: 2, month: 'November 2025', recipients: 22, scheduled: '2025-11-25', amount: '118.000.000 đ', status: 'Paid', statusColor: 'bg-green-100 text-green-700' },
    { id: 3, month: 'October 2025', recipients: 20, scheduled: '2025-10-25', amount: '110.500.000 đ', status: 'Paid', statusColor: 'bg-green-100 text-green-700' },
  ];

  // Mock risk fund activities
  const riskFundActivities = [
    { id: 1, type: 'deduction', description: 'Auto-deduction 5% (Nov 2025 Payout)', date: '2025-11-25', amount: '+450$' },
    { id: 2, type: 'compensation', description: 'Compensation: Server Crash Incident #992', date: '2025-11-10', amount: '-1200$' },
    { id: 3, type: 'deduction', description: 'Auto-deduction 5% (Oct 2025 Payout)', date: '2025-10-25', amount: '+410$' },
    { id: 4, type: 'deduction', description: 'Auto-deduction 5% (Sep 2025 Payout)', date: '2025-09-25', amount: '+380$' },
  ];

  const handleSaveRiskFund = () => {
    setIsSavingRiskFund(true);
    setTimeout(() => {
      setIsSavingRiskFund(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 600);
  };

  const fmtVnd = (num: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);

  return (
    <div className="min-h-screen bg-gray-50">
      <TopHeader 
        title="Finance & Profit"
        icon={<DollarSign className="w-6 h-6" />}
      />

      <div className="p-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Finance & Commission (SRS III.4)</h1>
          <p className="text-gray-600">
            Quản trị Lợi nhuận ròng, Quỹ rủi ro (Risk Fund), Khấu trừ nợ truy thu trần 30% (Clawback Cap), và Quyết toán tháng.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('profit')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-colors ${
              activeTab === 'profit'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            Profit & Clawback Cap 30%
          </button>
          <button
            onClick={() => setActiveTab('payout')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-colors ${
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
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-colors ${
              activeTab === 'riskfund'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Shield className="w-5 h-5" />
            Risk Fund Strategy (Quỹ Rủi Ro)
          </button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Net Profit (Tháng này)</p>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">42.890.000 đ</p>
            <p className="text-xs text-green-600 mt-1 font-medium">↑ +15% so với tháng trước</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Hoa hồng chờ quyết toán</p>
              <CreditCard className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">12.450.000 đ</p>
            <p className="text-xs text-gray-500 mt-1">24 nhân sự Sale & Tech</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Quỹ Rủi Ro (Risk Fund)</p>
              <Shield className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">8.200.000 đ</p>
            <p className="text-xs text-purple-600 mt-1 font-medium">Tỷ lệ trích: {deductionRate}% Net Profit</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Nợ truy thu treo (Carry-Forward)</p>
              <AlertCircle className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-3xl font-bold text-amber-600">{fmtVnd(5500000)}</p>
            <p className="text-xs text-amber-700 mt-1 font-medium">2 hồ sơ hoãn do trần 30% MTD</p>
          </div>
        </div>

        {/* Profit & Clawback Tab */}
        {activeTab === 'profit' && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-6">
              {/* Left 2/3 - Real-time Profit Stream */}
              <div className="col-span-2 space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900">Công thức Lợi nhuận Ròng & Phân bổ (SRS III.4)</h2>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-mono font-semibold">
                      Standard Formula
                    </span>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-2 mb-4 font-mono text-xs">
                    <div>
                      <span className="text-green-700 font-bold">Net_Profit</span> = Basic_Price - COGS (FIFO) - Internal_Costs - VAT
                    </div>
                    <div>
                      <span className="text-indigo-700 font-bold">Allocatable_Profit</span> = Net_Profit × (100% - RiskFund%)
                    </div>
                    <div className="text-gray-500 text-[11px] pt-1 border-t border-gray-200 font-sans">
                      * Surcharges (k-multiplier) thuộc về đội kỹ thuật (Tech Pool), không tính vào căn cứ hoa hồng của Sale.
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-gray-800 mb-3">Luồng lợi nhuận theo Ticket gần nhất</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          <th className="py-3 px-4">Ticket</th>
                          <th className="py-3 px-4">Mô hình</th>
                          <th className="py-3 px-4">Ngày</th>
                          <th className="py-3 px-4 text-right">Lợi nhuận ròng</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-sm">
                        {profitStream.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                            <td className="py-3 px-4">
                              <span className="font-mono font-bold text-blue-600">{item.ticket}</span>
                              <div className="text-xs text-gray-500">{item.description}</div>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${item.modelColor}`}>
                                {item.model}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-xs text-gray-600">{item.date}</td>
                            <td className="py-3 px-4 text-right font-bold text-green-600">{item.profit}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right 1/3 - Clawback Summary Alert */}
              <div className="col-span-1">
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
                  <h2 className="text-lg font-bold text-gray-900">Quy tắc Trần Truy thu 30% (SRS III.4)</h2>
                  
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 space-y-2">
                    <div className="font-bold flex items-center gap-1.5 text-amber-950">
                      <Shield className="w-4 h-4 text-amber-700" />
                      Quy định bảo đảm thu nhập tối thiểu:
                    </div>
                    <p className="leading-relaxed">
                      Mức trừ truy thu hoa hồng (clawback) trong một kỳ tháng của nhân sự tối đa không vượt quá 
                      <span className="font-bold text-amber-950"> 30% tổng hoa hồng kiếm được trong tháng đó</span>.
                    </p>
                    <p className="leading-relaxed">
                      Khoản vượt mức tự động chuyển thành nợ treo chuyển kỳ (Carry-Forward Debt) để tự động cấn trừ vào các kỳ tháng tiếp theo.
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tổng nợ truy thu phát sinh:</span>
                      <span className="font-bold text-red-600">{fmtVnd(8500000)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Đã trừ ngay trong kỳ (≤ 30% MTD):</span>
                      <span className="font-bold text-green-700">{fmtVnd(3000000)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="text-gray-800 font-semibold">Treo chuyển kỳ sau (Carry-Forward):</span>
                      <span className="font-bold text-amber-600">{fmtVnd(5500000)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Carry-Forward Clawback Table (Dedicated Full Width Section) */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-600" />
                    Bảng theo dõi Nợ Truy thu Treo Chuyển kỳ (Carry-Forward Debts)
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Các trường hợp được áp dụng bảo vệ trần 30% MTD, đang chờ thu hồi tự động trong các kỳ lương/quyết toán sau.
                  </p>
                </div>
                <span className="text-xs bg-amber-100 text-amber-800 px-3 py-1 rounded-full font-semibold">
                  {carryForwardDebts.length} hồ sơ đang theo dõi
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 border-y border-gray-200 text-xs font-semibold text-gray-600 uppercase">
                      <th className="py-3 px-4">Mã Nợ</th>
                      <th className="py-3 px-4">Nhân sự</th>
                      <th className="py-3 px-4">Căn cứ (Ticket/RMA)</th>
                      <th className="py-3 px-4 text-right">Tổng truy thu</th>
                      <th className="py-3 px-4 text-right">Thu nhập tháng (MTD)</th>
                      <th className="py-3 px-4 text-right">Đã trừ (Trần 30%)</th>
                      <th className="py-3 px-4 text-right">Nợ chuyển kỳ sau</th>
                      <th className="py-3 px-4">Kỳ cấn trừ tiếp theo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {carryForwardDebts.map((item) => (
                      <tr key={item.id} className="hover:bg-amber-50/30 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-gray-800">{item.id}</td>
                        <td className="py-3.5 px-4 font-medium text-gray-900">{item.saleRep}</td>
                        <td className="py-3.5 px-4 text-xs font-mono text-blue-600">{item.ticketRef}</td>
                        <td className="py-3.5 px-4 text-right font-bold text-red-600">{fmtVnd(item.totalClawback)}</td>
                        <td className="py-3.5 px-4 text-right text-xs font-mono text-gray-600">{fmtVnd(item.monthlyIncome)}</td>
                        <td className="py-3.5 px-4 text-right text-xs font-mono text-green-700">{fmtVnd(item.deductedImmediate)}</td>
                        <td className="py-3.5 px-4 text-right font-bold text-amber-700">{fmtVnd(item.carryForwardRemaining)}</td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            <Clock className="w-3 h-3" />
                            {item.nextPeriod}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Payout Settlement Tab */}
        {activeTab === 'payout' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-6">COMMISSION LIFECYCLE (STATE MACHINE)</h2>

              <div className="flex items-center justify-between max-w-5xl mx-auto">
                {[
                  { stage: 1, label: 'Pending', sublabel: 'Ticket Created', active: false },
                  { stage: 2, label: 'Available', sublabel: 'Ticket Closed & Handover', active: false },
                  { stage: 3, label: 'Frozen', sublabel: 'Period Close (25th)', active: true },
                  { stage: 4, label: 'Processing', sublabel: 'Bank Transfer', active: false },
                  { stage: 5, label: 'Paid', sublabel: 'Money Received', active: false },
                ].map((item) => (
                  <div key={item.stage} className="flex flex-col items-center">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 mb-2 ${
                      item.active 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                        : 'bg-gray-100 border-gray-300 text-gray-400'
                    }`}>
                      <span className="text-xl font-bold">{item.stage}</span>
                    </div>
                    <p className={`font-semibold text-xs mb-0.5 ${item.active ? 'text-gray-900' : 'text-gray-500'}`}>
                      {item.label}
                    </p>
                    <p className="text-[11px] text-gray-400">{item.sublabel}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Các Đợt Quyết toán Tháng</h2>
              <div className="space-y-3">
                {settlementBatches.map((batch) => (
                  <div key={batch.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100/70 transition-colors">
                    <div>
                      <h3 className="font-bold text-gray-900">{batch.month}</h3>
                      <p className="text-xs text-gray-500">Số lượng nhân sự nhận: {batch.recipients} • Ngày thanh toán: {batch.scheduled}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">{batch.amount}</p>
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold mt-1 ${batch.statusColor}`}>
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
            <div className="col-span-1 space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Cấu hình Quỹ Rủi Ro (SRS III.4)</h2>

                {/* Status Toggle */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Kích hoạt Quỹ Rủi Ro</label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={riskFundEnabled} 
                        onChange={(e) => setRiskFundEnabled(e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">
                    Khi bật, tỷ lệ % sẽ được tự động trích từ Net Profit trước khi phân bổ hoa hồng Sale & Tech.
                  </p>
                </div>

                {/* Deduction Rate Slider */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Tỷ lệ trích Quỹ (%)</label>
                    <span className="text-xl font-bold text-blue-600">{deductionRate}%</span>
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
                  <p className="text-xs text-gray-600 mt-2 font-mono">
                    Công thức: Allocatable_Profit = Net_Profit × (100% - {deductionRate}%)
                  </p>
                </div>

                {/* Safety Cap */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-gray-700 block mb-2">Hạn mức Trần An toàn (Safety Cap)</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value="100.000.000 đ"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                      readOnly
                    />
                  </div>
                  <p className="text-xs text-blue-600 mt-2">
                    Tự động tạm dừng trích quỹ khi số dư tích lũy chạm mức trần an toàn này.
                  </p>
                </div>

                {saveSuccess && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-xs text-green-700 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                    Đã lưu cấu hình Quỹ Rủi Ro thành công!
                  </div>
                )}

                <button
                  onClick={handleSaveRiskFund}
                  disabled={isSavingRiskFund}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
                >
                  <Save className="w-4 h-4" />
                  {isSavingRiskFund ? 'Đang lưu...' : 'Lưu cấu hình Quỹ'}
                </button>
              </div>

              {/* Total Fund Balance Card */}
              <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-xl p-6 text-white shadow-md">
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-8 h-8" />
                  <div>
                    <p className="text-xs opacity-90">Tổng Số dư Quỹ Rủi Ro</p>
                    <p className="text-3xl font-bold">8.200.000 đ</p>
                  </div>
                </div>
                <button className="w-full py-2 bg-white text-indigo-700 rounded-lg font-bold text-xs hover:bg-gray-100 transition-colors">
                  Chi bồi thường sự cố (Disburse)
                </button>
              </div>
            </div>

            {/* Right 2/3 - Fund Activity Log */}
            <div className="col-span-2">
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">Lịch sử Biến động Quỹ Rủi Ro</h2>
                  <span className="text-xs text-blue-600 font-medium cursor-pointer hover:underline">
                    Xem toàn bộ lịch sử
                  </span>
                </div>

                <div className="space-y-3">
                  {riskFundActivities.map((activity) => (
                    <div 
                      key={activity.id} 
                      className={`flex items-center justify-between p-4 rounded-xl border ${
                        activity.type === 'deduction' 
                          ? 'bg-green-50/60 border-green-200' 
                          : 'bg-red-50/60 border-red-200'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          activity.type === 'deduction' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {activity.type === 'deduction' ? (
                            <Activity className="w-5 h-5" />
                          ) : (
                            <AlertCircle className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <h3 className={`font-semibold text-sm ${
                            activity.type === 'deduction' ? 'text-green-950' : 'text-red-950'
                          }`}>
                            {activity.description}
                          </h3>
                          <p className="text-xs text-gray-500">{activity.date}</p>
                        </div>
                      </div>
                      <div className={`text-base font-bold font-mono ${
                        activity.type === 'deduction' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {activity.amount}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-200">
                  <div className="p-4 bg-green-50 rounded-xl">
                    <p className="text-xs text-green-700 mb-1 font-medium">Tổng Trích Quỹ (3 tháng)</p>
                    <p className="text-2xl font-bold text-green-600">+1.240.000 đ</p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-xl">
                    <p className="text-xs text-red-700 mb-1 font-medium">Tổng Chi Bồi Thường (3 tháng)</p>
                    <p className="text-2xl font-bold text-red-600">-1.200.000 đ</p>
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