import { NextRequest, NextResponse } from 'next/server';
import { protoListTickets } from '@/lib/proto/ticket-client';

export interface ProfitStreamItem {
  id: string;
  ticketId: string;
  ticketCode: string;
  description: string;
  model: 'ONE-DEAL' | 'RECURRING';
  date: string;
  revenue: number;
  cogs: number;
  profit: number;
  allocatableProfit: number; // after 5% risk fund
}

export interface ClawbackDebtItem {
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

export interface SettlementBatchItem {
  id: string;
  month: string;
  recipients: number;
  scheduled: string;
  amount: number;
  status: 'Draft' | 'Approved' | 'Paid';
}

export interface RiskFundActivity {
  id: string;
  type: 'deduction' | 'compensation';
  description: string;
  date: string;
  amount: number;
  balanceAfter: number;
}

// In-memory persistent state for Risk Fund config and settlements during server runtime
let globalRiskFundRate = 0.05; // 5% default (SRS III.4)
let globalRiskFundBalance = 48500000; // 48.5M VND

let inMemorySettlementBatches: SettlementBatchItem[] = [
  { id: 'sb-01', month: 'Tháng 02/2026', recipients: 24, scheduled: '2026-02-25', amount: 145000000, status: 'Paid' },
  { id: 'sb-02', month: 'Tháng 01/2026', recipients: 22, scheduled: '2026-01-25', amount: 132000000, status: 'Paid' },
  { id: 'sb-03', month: 'Tháng 12/2025', recipients: 20, scheduled: '2025-12-25', amount: 125000000, status: 'Paid' },
];

let inMemoryClawbackDebts: ClawbackDebtItem[] = [
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
    status: 'DEFERRED_30_CAP',
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
    status: 'DEFERRED_30_CAP',
  },
];

let inMemoryRiskFundActivities: RiskFundActivity[] = [
  { id: 'rf-1', type: 'deduction', description: 'Trích quỹ 5% từ Ticket hoàn thành T-9921', date: '2026-02-28', amount: 150000, balanceAfter: 48500000 },
  { id: 'rf-2', type: 'compensation', description: 'Bồi thường SLA sự cố Server Downtime #8812', date: '2026-02-15', amount: -2000000, balanceAfter: 48350000 },
  { id: 'rf-3', type: 'deduction', description: 'Trích quỹ 5% Quyết toán Tháng 01/2026', date: '2026-01-25', amount: 6600000, balanceAfter: 50350000 },
  { id: 'rf-4', type: 'deduction', description: 'Trích quỹ 5% Quyết toán Tháng 12/2025', date: '2025-12-25', amount: 6250000, balanceAfter: 43750000 },
];

export async function GET(request: NextRequest) {
  try {
    // 1. Fetch tickets to get real profit stream
    let profitStreams: ProfitStreamItem[] = [];
    try {
      const ticketResult = await protoListTickets({ pageSize: 20 });
      if (ticketResult.success && ticketResult.response) {
        const rawTickets = (ticketResult.response as any).tickets || [];
        profitStreams = rawTickets.map((t: any, index: number) => {
          const estimated = Number(t.estimatedPrice || t.estimated_price || 0);
          const revenue = estimated > 0 ? estimated : (3000000 + (index * 1500000) % 25000000);
          const cogs = Math.round(revenue * 0.45);
          const netProfit = Math.round(revenue - cogs);
          const allocatable = Math.round(netProfit * (1 - globalRiskFundRate));

          const isRecurring = index % 3 === 1;
          const createdAt = t.createdAt?.seconds 
            ? new Date(Number(t.createdAt.seconds) * 1000).toISOString().split('T')[0]
            : '2026-02-28';

          return {
            id: t.id || `stream-${index}`,
            ticketId: t.id || `T-99${index}`,
            ticketCode: t.ticketCode || t.ticket_code || `#T-${9920 + index}`,
            description: t.title || 'Dịch vụ Kỹ thuật & Vật tư thay thế',
            model: isRecurring ? 'RECURRING' : 'ONE-DEAL',
            date: createdAt,
            revenue,
            cogs,
            profit: netProfit,
            allocatableProfit: allocatable,
          };
        });
      }
    } catch (e) {
      console.warn('[Finance Overview API] Could not fetch tickets, using fallback streams:', e);
    }

    // Default profit streams if none
    if (profitStreams.length === 0) {
      profitStreams = [
        { id: '1', ticketId: 't-1', ticketCode: '#T-9921', description: 'Server Hardware Upgrade (Dell R740)', model: 'ONE-DEAL', date: '2026-02-20', revenue: 7500000, cogs: 4500000, profit: 3000000, allocatableProfit: 2850000 },
        { id: '2', ticketId: 't-2', ticketCode: '#T-9922', description: 'Monthly Maintenance Contract - Zone B', model: 'RECURRING', date: '2026-02-22', revenue: 2000000, cogs: 900000, profit: 1100000, allocatableProfit: 1045000 },
        { id: '3', ticketId: 't-3', ticketCode: '#T-9923', description: 'Enterprise Network Core Setup (Cisco Catalyst)', model: 'ONE-DEAL', date: '2026-02-25', revenue: 450000000, cogs: 250000000, profit: 200000000, allocatableProfit: 190000000 },
      ];
    }

    const totalNetProfitMtd = profitStreams.reduce((acc, curr) => acc + curr.profit, 0);
    const totalClawbackRemaining = inMemoryClawbackDebts.reduce((acc, curr) => acc + curr.carryForwardRemaining, 0);

    return NextResponse.json({
      summary: {
        totalNetProfitMtd,
        riskFundBalance: globalRiskFundBalance,
        riskFundRate: globalRiskFundRate * 100, // percentage e.g. 5%
        totalClawbackRemaining,
        nextSettlementDate: '25/03/2026',
      },
      profitStreams,
      carryForwardDebts: inMemoryClawbackDebts,
      settlementBatches: inMemorySettlementBatches,
      riskFundActivities: inMemoryRiskFundActivities,
    });
  } catch (error) {
    console.error('[Finance Overview API] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'UPDATE_RISK_FUND') {
      const rate = Number(body.rate);
      if (rate >= 0 && rate <= 30) {
        globalRiskFundRate = rate / 100;
        return NextResponse.json({ success: true, newRate: rate });
      }
      return NextResponse.json({ error: 'Tỷ lệ quỹ rủi ro phải từ 0% đến 30%' }, { status: 400 });
    }

    if (action === 'CREATE_SETTLEMENT') {
      const { month, recipients, amount } = body;
      const newBatch: SettlementBatchItem = {
        id: `sb-${Date.now()}`,
        month: month || 'Tháng 03/2026',
        recipients: Number(recipients) || 25,
        scheduled: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        amount: Number(amount) || 155000000,
        status: 'Draft',
      };
      inMemorySettlementBatches.unshift(newBatch);
      return NextResponse.json({ success: true, batch: newBatch }, { status: 201 });
    }

    return NextResponse.json({ error: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (error) {
    console.error('[Finance API] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
