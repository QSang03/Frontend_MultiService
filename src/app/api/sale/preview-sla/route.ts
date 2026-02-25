import { NextResponse } from 'next/server';
import { protoPreviewSLA } from '@/lib/proto/ticket-client';

type PreviewSlaRequest = {
  category_id?: string;
  service_id?: string;
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

  const categoryId = String(body.category_id ?? '').trim();
  if (!categoryId) {
    return NextResponse.json({ error: 'category_id is required' }, { status: 400 });
  }

  const priority = String(body.priority ?? 'medium').toLowerCase();
  const orgId = String(body.org_id ?? '').trim();
  if (!orgId) {
    return NextResponse.json({ error: 'org_id is required' }, { status: 400 });
  }

  const serviceId = String(body.service_id ?? '').trim() || undefined;
  const result = await protoPreviewSLA({
    categoryId,
    serviceId,
    priority,
    orgId,
  });

  if (!result.success || !result.response) {
    return NextResponse.json({ error: result.error || 'PreviewSLA failed' }, { status: 500 });
  }

  const resp = result.response as Record<string, unknown>;
  const targetResponseAt = (resp.targetResponseAt ?? resp.target_response_at) as Record<string, unknown> | undefined;
  const slaHours = Number(resp.slaHours ?? resp.sla_hours ?? 0);

  const now = Date.now();
  const secondsField = targetResponseAt?.seconds;
  const secondsRaw =
    secondsField == null
      ? undefined
      : typeof secondsField === 'number' || typeof secondsField === 'string'
        ? secondsField
        : String(secondsField);
  const responseAtMs = secondsRaw == null ? undefined : Number(secondsRaw) * 1000;
  const targetResponseMinutes =
    responseAtMs == null || Number.isNaN(responseAtMs)
      ? (PRIORITY_TO_SLA[priority] ?? PRIORITY_TO_SLA.medium).response
      : Math.max(1, Math.round((responseAtMs - now) / 60000));

  const targetResolutionMinutes = slaHours > 0
    ? slaHours * 60
    : (PRIORITY_TO_SLA[priority] ?? PRIORITY_TO_SLA.medium).resolution;

  const appliedSource: PreviewSlaResponse['appliedSource'] = orgId ? 'tenant-config' : 'system-default';
  const businessHours = appliedSource === 'tenant-config' ? 'Mon-Fri 08:00-18:00' : 'Mon-Sat 08:00-17:00';
  const hour = new Date().getHours();
  const outsideBusinessHours = hour < 8 || hour >= 18;
  const breachRisk: PreviewSlaResponse['breachRisk'] =
    outsideBusinessHours && priority === 'critical' ? 'high' :
    outsideBusinessHours ? 'medium' : 'low';

  const response: PreviewSlaResponse = {
    ticketId: categoryId,
    appliedSource,
    businessHours,
    targetResponseMinutes,
    targetResolutionMinutes,
    breachRisk,
  };

  return NextResponse.json(response);
}
