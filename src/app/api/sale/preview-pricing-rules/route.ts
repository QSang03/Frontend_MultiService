import { NextResponse } from 'next/server';
import { protoPreviewPricingRules } from '@/lib/proto/ticket-client';

type PreviewPricingRulesRequest = {
  org_id?: string;
  priority?: string;
  sla_hours?: number;
  base_amount?: number;
};

type PricingRuleBreakdown = {
  code: string;
  label: string;
  k: number;
  note: string;
};

type PreviewPricingRulesResponse = {
  ticketId: string;
  baseAmount: number;
  totalMultiplier: number;
  estimatedAmount: number;
  breakdown: PricingRuleBreakdown[];
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as PreviewPricingRulesRequest;
  const orgId = String(body.org_id ?? '').trim();

  if (!orgId) {
    return NextResponse.json({ error: 'org_id is required' }, { status: 400 });
  }

  const priority = String(body.priority ?? 'medium').toLowerCase();
  const slaHours = Number(body.sla_hours ?? 4);
  const baseAmount = Number(body.base_amount ?? 1000000);

  const result = await protoPreviewPricingRules({
    orgId,
    priority,
    slaHours,
  });

  if (!result.success || !result.response) {
    return NextResponse.json({ error: result.error || 'PreviewPricingRules failed' }, { status: 500 });
  }

  const resp = result.response as Record<string, unknown>;
  const totalMultiplier = Number(resp.totalMultiplier ?? resp.total_multiplier ?? 1);
  const breakdownRaw = Array.isArray(resp.breakdown) ? (resp.breakdown as Array<Record<string, unknown>>) : [];
  const breakdown: PricingRuleBreakdown[] = breakdownRaw.map((rule, idx) => {
    const k = Number(rule.multiplier ?? 1);
    return {
      code: String(rule.category ?? `RULE_${idx + 1}`),
      label: String(rule.name ?? `Rule ${idx + 1}`),
      k: Number.isNaN(k) ? 1 : k,
      note: String(rule.category ?? ''),
    };
  });
  const estimatedAmount = Math.round(baseAmount * totalMultiplier);

  const response: PreviewPricingRulesResponse = {
    ticketId: orgId,
    baseAmount,
    totalMultiplier,
    estimatedAmount,
    breakdown,
  };

  return NextResponse.json(response);
}
