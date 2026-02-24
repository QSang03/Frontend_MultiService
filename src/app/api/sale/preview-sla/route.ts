import { NextResponse } from 'next/server';

type PreviewSlaRequest = {
  ticket_id?: string;
  org_id?: string;
  priority?: string;
};

type PreviewSlaResponse = {
  ticketId: string;
  appliedSource: 'tenant-config' | 'system-default';
  businessHours: string;
  targetResponseMinutes: number;
  targetResolutionMinutes: number;
  breachRisk: 'low' | 'medium' | 'high';
};

const PRIORITY_TO_SLA: Record<string, { response: number; resolution: number }> = {
  critical: { response: 30, resolution: 240 },
  high: { response: 60, resolution: 480 },
  medium: { response: 240, resolution: 1440 },
  low: { response: 480, resolution: 2880 },
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as PreviewSlaRequest;

  const ticketId = String(body.ticket_id ?? '').trim();
  if (!ticketId) {
    return NextResponse.json({ error: 'ticket_id is required' }, { status: 400 });
  }

  const priority = String(body.priority ?? 'medium').toLowerCase();
  const sla = PRIORITY_TO_SLA[priority] ?? PRIORITY_TO_SLA.medium;

  const orgId = String(body.org_id ?? '').trim();
  const appliedSource: PreviewSlaResponse['appliedSource'] = orgId ? 'tenant-config' : 'system-default';
  const businessHours = appliedSource === 'tenant-config' ? 'Mon-Fri 08:00-18:00' : 'Mon-Sat 08:00-17:00';

  const hour = new Date().getHours();
  const outsideBusinessHours = hour < 8 || hour >= 18;
  const breachRisk: PreviewSlaResponse['breachRisk'] =
    outsideBusinessHours && priority === 'critical' ? 'high' :
    outsideBusinessHours ? 'medium' : 'low';

  const response: PreviewSlaResponse = {
    ticketId,
    appliedSource,
    businessHours,
    targetResponseMinutes: sla.response,
    targetResolutionMinutes: sla.resolution,
    breachRisk,
  };

  return NextResponse.json(response);
}
