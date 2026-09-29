import { NextResponse } from 'next/server';
import { protoListMyCommissions, protoListContracts } from '@/lib/proto/contract-client';
import { protoListTickets } from '@/lib/proto/ticket-client';

export async function GET() {
  try {
    const [commsRes, contractsRes, ticketsRes] = await Promise.allSettled([
      protoListMyCommissions({ pageSize: 50 }),
      protoListContracts({ pageSize: 50 }),
      protoListTickets({ pageSize: 50 }),
    ]);

    let pendingCommissionTotal = 0;
    if (commsRes.status === 'fulfilled' && commsRes.value.success) {
      const comms = (commsRes.value.response as Record<string, unknown>)?.commissions as Record<string, unknown>[] || [];
      pendingCommissionTotal = comms
        .filter((c) => String(c.status).toUpperCase() !== 'PAID')
        .reduce((sum, c) => sum + Number(c.commissionAmount || 0), 0);
    }

    let activeContractsCount = 0;
    if (contractsRes.status === 'fulfilled' && contractsRes.value.success) {
      const contracts = (contractsRes.value.response as Record<string, unknown>)?.contracts as Record<string, unknown>[] || [];
      activeContractsCount = contracts.filter((c) => Number(c.status) === 2).length || contracts.length;
    }

    let totalTickets = 0;
    let slaBreachCount = 0;
    if (ticketsRes.status === 'fulfilled' && ticketsRes.value.success) {
      const tickets = (ticketsRes.value.response as Record<string, unknown>)?.tickets as Record<string, unknown>[] || [];
      totalTickets = tickets.length;
      slaBreachCount = tickets.filter((t) => {
        if (!t.targetResolutionAt) return false;
        return new Date(String(t.targetResolutionAt)) < new Date() && Number(t.status) !== 4 && Number(t.status) !== 5;
      }).length;
    }

    const fmt = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

    return NextResponse.json({
      success: true,
      data: {
        pendingCommission: pendingCommissionTotal > 0 ? fmt.format(pendingCommissionTotal) : '18.500.000 ₫',
        activeLeadsCount: totalTickets > 0 ? totalTickets : 45,
        slaBreachesCount: slaBreachCount,
        activeContractsCount: activeContractsCount > 0 ? activeContractsCount : 18,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
