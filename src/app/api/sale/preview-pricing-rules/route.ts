import { NextResponse } from 'next/server';

type PreviewPricingRulesRequest = {
  ticket_id?: string;
  priority?: string;
  status?: string;
  service_id?: string;
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

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as PreviewPricingRulesRequest;
  const ticketId = String(body.ticket_id ?? '').trim();

  if (!ticketId) {
    return NextResponse.json({ error: 'ticket_id is required' }, { status: 400 });
  }

  const priority = String(body.priority ?? 'medium').toLowerCase();
  const status = String(body.status ?? 'DRAFT').toUpperCase();
  const baseAmount = Number(body.base_amount ?? 1000000);

  const breakdown: PricingRuleBreakdown[] = [
    { code: 'BASE', label: 'Giá cơ bản', k: 1, note: 'Base service price' },
  ];

  if (priority === 'critical') {
    breakdown.push({ code: 'PRIORITY_CRITICAL', label: 'Ưu tiên khẩn', k: 1.4, note: 'Critical service handling' });
  } else if (priority === 'high') {
    breakdown.push({ code: 'PRIORITY_HIGH', label: 'Ưu tiên cao', k: 1.2, note: 'High priority handling' });
  } else if (priority === 'low') {
    breakdown.push({ code: 'PRIORITY_LOW', label: 'Ưu tiên thấp', k: 0.95, note: 'Low urgency discount' });
  }

  const hour = new Date().getHours();
  if (hour < 8 || hour >= 18) {
    breakdown.push({ code: 'AFTER_HOURS', label: 'Phụ phí ngoài giờ', k: 1.15, note: 'Outside business hours' });
  }

  if (status === 'AGREED') {
    breakdown.push({ code: 'CONSULTATION_COMMIT', label: 'Cam kết giải pháp', k: 1.05, note: 'Post-agreement scope lock' });
  }

  const totalMultiplier = round2(breakdown.reduce((acc, rule) => acc * rule.k, 1));
  const estimatedAmount = Math.round(baseAmount * totalMultiplier);

  const response: PreviewPricingRulesResponse = {
    ticketId,
    baseAmount,
    totalMultiplier,
    estimatedAmount,
    breakdown,
  };

  return NextResponse.json(response);
}
