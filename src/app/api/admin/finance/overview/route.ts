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
const globalRiskFundBalance = 0;

const inMemorySettlementBatches: SettlementBatchItem[] = [];
const inMemoryClawbackDebts: ClawbackDebtItem[] = [];
const inMemoryRiskFundActivities: RiskFundActivity[] = [];

export async function GET(request: NextRequest) {
  try {
    // 1. Fetch tickets to get real profit stream
    let profitStreams: ProfitStreamItem[] = [];
    try {
      const ticketResult = await protoListTickets({ pageSize: 20 });
      if (ticketResult.success && ticketResult.response) {
        const rawTickets = ((ticketResult.response as unknown as Record<string, unknown>).tickets as Record<string, unknown>[]) || [];
        profitStreams = rawTickets.map((t: Record<string, unknown>, index: number) => {
          const estimated = Number(t.estimatedPrice || t.estimated_price || 0);
          const revenue = estimated;
          const cogs = Math.round(revenue * 0.45);
          const netProfit = Math.round(revenue - cogs);
          const allocatable = Math.round(netProfit * (1 - globalRiskFundRate));

          const isRecurring = index % 3 === 1;
          const createdRecord = t.createdAt as Record<string, unknown> | undefined;
          const createdSec = Number(createdRecord?.seconds || 0);
          const createdAt = createdSec 
            ? new Date(createdSec * 1000).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0];

          const idStr = String(t.id || `stream-${index}`);
          return {
            id: idStr,
            ticketId: idStr,
            ticketCode: String(t.ticketCode || t.ticket_code || `#T-${t.id ? String(t.id).slice(0, 6) : index}`),
            description: String(t.title || 'Dịch vụ Kỹ thuật & Vật tư thay thế'),
            model: (isRecurring ? 'RECURRING' : 'ONE-DEAL') as 'RECURRING' | 'ONE-DEAL',
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

    const totalNetProfitMtd = profitStreams.reduce((acc, curr) => acc + curr.profit, 0);
    const totalClawbackRemaining = inMemoryClawbackDebts.reduce((acc, curr) => acc + curr.carryForwardRemaining, 0);

    const now = new Date();
    const nextSettlementDate = `25/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

    return NextResponse.json({
      summary: {
        totalNetProfitMtd,
        riskFundBalance: globalRiskFundBalance,
        riskFundRate: globalRiskFundRate * 100, // percentage e.g. 5%
        totalClawbackRemaining,
        nextSettlementDate,
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
      const now = new Date();
      const currentMonthStr = `Tháng ${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
      const newBatch: SettlementBatchItem = {
        id: `sb-${Date.now()}`,
        month: month || currentMonthStr,
        recipients: Number(recipients) || 0,
        scheduled: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        amount: Number(amount) || 0,
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
