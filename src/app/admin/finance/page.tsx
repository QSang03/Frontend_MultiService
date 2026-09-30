'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  RefreshCw,
  Plus,
  Percent,
  Layers
} from 'lucide-react';
import TopHeader from '@/components/layout/TopHeader';
import internalApiClient from '@/lib/api/internal-client';
import { toast } from '@/components/ui/Toast';

interface ProfitStreamItem {
  id: string;
  ticketId: string;
  ticketCode: string;
  description: string;
  model: 'ONE-DEAL' | 'RECURRING';
  date: string;
  revenue: number;
  cogs: number;
  profit: number;
  allocatableProfit: number;
}

interface ClawbackDebtItem {
  id: string;
  saleRep: string;
  ticketRef: string;
  totalClawback: number;
  monthlyIncome: number;
  cap30Percent: number;
  deductedImmediate: number;
  carryForwardRemaining: number;
  nextPeriod: string;
  status: 'ACTIVE' | 'DEFERRED_30_CAP' | 'SETTLED';
}

interface SettlementBatchItem {
  id: string;
  month: string;
  recipients: number;
  scheduled: string;
  amount: number;
  status: 'Draft' | 'Approved' | 'Paid';
}

interface RiskFundActivity {
  id: string;
  type: 'deduction' | 'compensation';
  description: string;
  date: string;
  amount: number;
  balanceAfter: number;
}

interface FinanceSummary {
  totalNetProfitMtd: number;
  riskFundBalance: number;
  riskFundRate: number;
  totalClawbackRemaining: number;
  nextSettlementDate: string;
}

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState<'profit' | 'payout' | 'riskfund'>('profit');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [summary, setSummary] = useState<FinanceSummary>({
    totalNetProfitMtd: 0,
    riskFundBalance: 0,
    riskFundRate: 5,
    totalClawbackRemaining: 0,
    nextSettlementDate: '',
  });

  const [profitStreams, setProfitStreams] = useState<ProfitStreamItem[]>([]);
  const [carryForwardDebts, setCarryForwardDebts] = useState<ClawbackDebtItem[]>([]);
  const [settlementBatches, setSettlementBatches] = useState<SettlementBatchItem[]>([]);
  const [riskFundActivities, setRiskFundActivities] = useState<RiskFundActivity[]>([]);

  // Risk fund config
  const [riskFundRateInput, setRiskFundRateInput] = useState(5);
  const [isSavingRiskFund, setIsSavingRiskFund] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // New settlement modal
  const [isCreateSettlementOpen, setIsCreateSettlementOpen] = useState(false);
  const [newBatchMonth, setNewBatchMonth] = useState(() => {
    const now = new Date();
    return `Tháng ${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  });
  const [newBatchAmount, setNewBatchAmount] = useState('');
  const [newBatchRecipients, setNewBatchRecipients] = useState('');
  const [isSubmittingBatch, setIsSubmittingBatch] = useState(false);

  const fetchFinanceData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await internalApiClient.get('/api/admin/finance/overview');
      const data = response.data;
      if (data.summary) {
        setSummary(data.summary);
        setRiskFundRateInput(data.summary.riskFundRate || 5);
      }
      setProfitStreams(data.profitStreams || []);
      setCarryForwardDebts(data.carryForwardDebts || []);
      setSettlementBatches(data.settlementBatches || []);
      setRiskFundActivities(data.riskFundActivities || []);
    } catch (err: unknown) {
      console.error('Failed to fetch finance overview:', err);
      setError(err instanceof Error ? err.message : 'Failed to load finance data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFinanceData();
  }, [fetchFinanceData]);

  const handleSaveRiskFund = async () => {
    setIsSavingRiskFund(true);
    setSaveSuccess(false);
    try {
      await internalApiClient.post('/api/admin/finance/overview', {
        action: 'UPDATE_RISK_FUND',
        rate: riskFundRateInput,
      });
      setSaveSuccess(true);
      await fetchFinanceData();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      toast.error('Lỗi lưu cấu hình: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsSavingRiskFund(false);
    }
  };

  const handleCreateSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingBatch(true);
    try {
      await internalApiClient.post('/api/admin/finance/overview', {
        action: 'CREATE_SETTLEMENT',
        month: newBatchMonth,
        amount: Number(newBatchAmount),
        recipients: Number(newBatchRecipients),
      });
      setIsCreateSettlementOpen(false);
      toast.success('Đã tạo đợt quyết toán thành công!');
      await fetchFinanceData();
    } catch (err: unknown) {
      toast.error('Lỗi tạo đợt quyết toán: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsSubmittingBatch(false);
    }
  };

  const fmtVnd = (num: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <TopHeader 
        title="Finance & Profit"
        icon={<DollarSign className="w-6 h-6" />}
      />

      <div className="p-6">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Finance & Commission (SRS III.4)</h1>
            <p className="text-sm text-gray-600">
              Quản trị Lợi nhuận ròng, Quỹ rủi ro 5% (Risk Fund), Khấu trừ nợ truy thu trần 30% (Clawback Cap), và Quyết toán tháng.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchFinanceData}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-all shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
            <button
              onClick={() => setIsCreateSettlementOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Tạo Đợt Quyết Toán
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Net Profit (MTD)</p>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{fmtVnd(summary.totalNetProfitMtd)}</p>
            <p className="text-xs text-green-600 mt-1 font-medium">↑ Từ các Ticket dịch vụ hoàn thành</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Hoa hồng Quyết toán</p>
              <CreditCard className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {fmtVnd(settlementBatches.length > 0 ? settlementBatches[0].amount : 0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Kỳ tiếp theo: {summary.nextSettlementDate}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Quỹ Rủi Ro (Risk Fund)</p>
              <Shield className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{fmtVnd(summary.riskFundBalance)}</p>
            <p className="text-xs text-purple-600 mt-1 font-medium">Tỷ lệ trích: {summary.riskFundRate}% Net Profit</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Nợ truy thu gối đầu (Cap 30%)</p>
              <AlertCircle className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-3xl font-bold text-amber-600">{fmtVnd(summary.totalClawbackRemaining)}</p>
            <p className="text-xs text-amber-700 mt-1 font-medium">{carryForwardDebts.length} hồ sơ hoãn theo trần 30% MTD</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('profit')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'profit'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            Profit Streams & Trần Truy Thu 30%
          </button>
          <button
            onClick={() => setActiveTab('payout')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'payout'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <CreditCard className="w-5 h-5" />
            Đợt Quyết Toán (Settlement Batches)
          </button>
          <button
            onClick={() => setActiveTab('riskfund')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'riskfund'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Shield className="w-5 h-5" />
            Quỹ Rủi Ro & Bồi Thường SLA (5%)
          </button>
        </div>

        {/* 1. Profit & Clawback Tab */}
        {activeTab === 'profit' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2/3 - Real-time Profit Stream */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-gray-900">Công thức Lợi nhuận Ròng & Phân bổ (SRS III.4)</h2>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-mono font-semibold">
                      Standard Formula
                    </span>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-2 mb-4 font-mono text-xs">
                    <div>
                      <span className="text-green-700 font-bold">Net_Profit</span> = Doanh thu - COGS (Giá vốn FIFO/WMA) - Chi phí khác
                    </div>
                    <div>
                      <span className="text-indigo-700 font-bold">Allocatable_Profit</span> = Net_Profit × (100% - Quỹ_Rủi_Ro_5%)
                    </div>
                    <div className="text-gray-500 text-[11px] pt-1 border-t border-gray-200 font-sans">
                      * Phụ phí ngoài giờ / khẩn cấp (k-multiplier) được phân bổ vào Tech Pool (40/40/20), không tính vào căn cứ hoa hồng của Sale.
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-gray-800 mb-3">Dòng Lợi Nhuận Theo Ticket Dịch Vụ</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          <th className="py-3 px-4">Ticket</th>
                          <th className="py-3 px-4">Mô hình</th>
                          <th className="py-3 px-4">Ngày</th>
                          <th className="py-3 px-4 text-right">Doanh Thu</th>
                          <th className="py-3 px-4 text-right">Giá Vốn (COGS)</th>
                          <th className="py-3 px-4 text-right">Lợi Nhuận Ròng</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-sm">
                        {profitStreams.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-sm text-gray-400">
                              Chưa có dòng doanh thu hoặc giao dịch nào phát sinh trong kỳ.
                            </td>
                          </tr>
                        ) : (
                          profitStreams.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                              <td className="py-3 px-4">
                                <span className="font-mono font-bold text-blue-600">{item.ticketCode}</span>
                                <div className="text-xs text-gray-500">{item.description}</div>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                  item.model === 'RECURRING'
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {item.model}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-xs text-gray-600">{item.date}</td>
                              <td className="py-3 px-4 text-right font-medium text-gray-800">{fmtVnd(item.revenue)}</td>
                              <td className="py-3 px-4 text-right text-xs text-gray-500">{fmtVnd(item.cogs)}</td>
                              <td className="py-3 px-4 text-right font-bold text-green-600">{fmtVnd(item.profit)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right 1/3 - Clawback Summary Alert & Debt List */}
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
                  <h2 className="text-base font-bold text-gray-900">Quy tắc Trần Truy Thu 30% (SRS III.4)</h2>
                  
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 space-y-2">
                    <div className="font-bold flex items-center gap-1.5 text-amber-950">
                      <Shield className="w-4 h-4 text-amber-700" />
                      Quy định bảo đảm thu nhập tối thiểu:
                    </div>
                    <p className="leading-relaxed">
                      Mức trừ truy thu hoa hồng (clawback) trong một kỳ tháng của nhân sự tối đa không vượt quá 
                      <strong> 30% tổng thu nhập hoa hồng</strong> của tháng đó. Phần còn lại tự động gối đầu sang các kỳ thanh toán tiếp theo.
                    </p>
                  </div>

                  <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider pt-2">
                    Hồ sơ nợ truy thu đang gối đầu ({carryForwardDebts.length})
                  </h3>

                  <div className="space-y-3">
                    {carryForwardDebts.length === 0 ? (
                      <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-center text-xs text-gray-500">
                        Không có hồ sơ nợ truy thu nào đang gối đầu.
                      </div>
                    ) : (
                      carryForwardDebts.map((debt) => (
                        <div key={debt.id} className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-gray-900">{debt.saleRep}</span>
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-semibold text-[10px]">
                              {debt.status}
                            </span>
                          </div>
                          <div className="text-gray-500">Ref: {debt.ticketRef}</div>
                          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-200/60">
                            <div>
                              <span className="text-gray-500">Tổng truy thu:</span>{' '}
                              <span className="font-semibold text-gray-900">{fmtVnd(debt.totalClawback)}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Đã trừ (30% Cap):</span>{' '}
                              <span className="font-semibold text-emerald-700">-{fmtVnd(debt.deductedImmediate)}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-[11px] pt-1">
                            <span className="text-amber-800 font-bold">Gối đầu còn lại: {fmtVnd(debt.carryForwardRemaining)}</span>
                            <span className="text-gray-400">{debt.nextPeriod}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. Payout Settlement Tab */}
        {activeTab === 'payout' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-gray-900">Danh Sách Đợt Quyết Toán Hoa Hồng</h2>
                  <p className="text-xs text-gray-500">
                    Chu kỳ chốt lương/hoa hồng tự động khấu trừ nợ truy thu gối đầu và trích quỹ rủi ro.
                  </p>
                </div>
                <button
                  onClick={() => setIsCreateSettlementOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Mở Đợt Mới
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Kỳ Quyết Toán</th>
                      <th className="py-3 px-4">Số Nhân Sự Hưởng</th>
                      <th className="py-3 px-4">Ngày Chi Trả Dự Kiến</th>
                      <th className="py-3 px-4 text-right">Tổng Tiền Chi Trả</th>
                      <th className="py-3 px-4 text-center">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {settlementBatches.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-xs text-gray-500">
                          Chưa có đợt quyết toán hoa hồng nào. Bấm &quot;Mở Đợt Mới&quot; để tạo đợt quyết toán.
                        </td>
                      </tr>
                    ) : (
                      settlementBatches.map((batch) => (
                        <tr key={batch.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4 font-bold text-gray-900">{batch.month}</td>
                          <td className="py-3 px-4 text-gray-600">{batch.recipients} nhân sự (Sale/Tech)</td>
                          <td className="py-3 px-4 text-xs text-gray-500">{batch.scheduled}</td>
                          <td className="py-3 px-4 text-right font-bold text-blue-600">{fmtVnd(batch.amount)}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              batch.status === 'Paid'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {batch.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. Risk Fund Strategy Tab */}
        {activeTab === 'riskfund' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 1/3 - Config */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-600" />
                Cấu Hình Quỹ Rủi Ro (Risk Fund)
              </h2>
              <p className="text-xs text-gray-600">
                Tỷ lệ tự động trích lập từ Net Profit của từng ticket hoàn thành để dự phòng sự cố bồi thường SLA hoặc phạt hợp đồng.
              </p>

              {saveSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-xs font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Đã cập nhật tỷ lệ quỹ rủi ro thành công!
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                  Tỷ lệ trích lập (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="30"
                    step="0.5"
                    value={riskFundRateInput}
                    onChange={(e) => setRiskFundRateInput(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-bold text-purple-700 focus:ring-2 focus:ring-purple-500"
                  />
                  <Percent className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
                </div>
                <p className="text-[11px] text-gray-500 mt-1">Mặc định: 5% theo đặc tả SRS III.4.</p>
              </div>

              <button
                onClick={handleSaveRiskFund}
                disabled={isSavingRiskFund}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
              >
                {isSavingRiskFund ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    Lưu Cấu Hình Quỹ
                  </>
                )}
              </button>
            </div>

            {/* Right 2/3 - Ledger */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-base font-bold text-gray-900 mb-1">Sổ Nhật Ký Quỹ Rủi Ro (Risk Fund Ledger)</h2>
              <p className="text-xs text-gray-500 mb-4">
                Biến động số dư: Trích lập (+5% từ Ticket) vs Bồi thường vi phạm SLA sự cố (-).
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Loại Giao Dịch</th>
                      <th className="py-3 px-4">Diễn Giải</th>
                      <th className="py-3 px-4">Ngày</th>
                      <th className="py-3 px-4 text-right">Số Tiền</th>
                      <th className="py-3 px-4 text-right">Số Dư Sau Giao Dịch</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {riskFundActivities.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-xs text-gray-500">
                          Chưa có lịch sử giao dịch quỹ rủi ro phát sinh.
                        </td>
                      </tr>
                    ) : (
                      riskFundActivities.map((act) => (
                        <tr key={act.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                              act.type === 'deduction'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {act.type === 'deduction' ? '+ TRÍCH LẬP' : '- BỒI THƯỜNG'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs text-gray-700">{act.description}</td>
                          <td className="py-3 px-4 text-xs text-gray-500">{act.date}</td>
                          <td className={`py-3 px-4 text-right font-bold ${
                            act.amount > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {fmtVnd(act.amount)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-medium text-gray-800">
                            {fmtVnd(act.balanceAfter)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Tạo Đợt Quyết Toán */}
      {isCreateSettlementOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsCreateSettlementOpen(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 overflow-hidden animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-gray-900 mb-1">Mở Đợt Quyết Toán Hoa Hồng Mới</h3>
            <p className="text-xs text-gray-500 mb-4">
              Tạo chu kỳ thanh toán lương hoa hồng định kỳ cho đội ngũ Sale và Kỹ thuật.
            </p>

            <form onSubmit={handleCreateSettlement} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Kỳ Quyết Toán
                </label>
                <input
                  type="text"
                  required
                  value={newBatchMonth}
                  onChange={(e) => setNewBatchMonth(e.target.value)}
                  placeholder="VD: Tháng 03/2026"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Số Lượng Nhân Sự Nhận Hoa Hồng
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={newBatchRecipients}
                  onChange={(e) => setNewBatchRecipients(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Tổng Ngân Sách Hoa Hồng Dự Kiến (VNĐ)
                </label>
                <input
                  type="number"
                  required
                  min="1000000"
                  step="500000"
                  value={newBatchAmount}
                  onChange={(e) => setNewBatchAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-bold text-blue-700"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsCreateSettlementOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingBatch}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {isSubmittingBatch ? 'Đang tạo...' : 'Xác Nhận Tạo Đợt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}