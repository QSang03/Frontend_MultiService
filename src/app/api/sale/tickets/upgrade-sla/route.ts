import { NextResponse } from 'next/server';
import { protoUpgradeTicketSLA } from '@/lib/proto/ticket-client';

function timestampToIso(ts?: unknown): string | undefined {
  if (!ts) return undefined;
  const t = ts as Record<string, unknown>;
  const secondsField = t.seconds;
  const secondsRaw =
    secondsField == null
      ? undefined
      : typeof secondsField === 'number' || typeof secondsField === 'string'
        ? secondsField
        : String(secondsField);
  if (secondsRaw == null) return undefined;
  const seconds = Number(secondsRaw);
  if (Number.isNaN(seconds)) return undefined;
  const nanos = Number((t.nanos as number | undefined) ?? 0);
  const ms = seconds * 1000 + Math.floor(nanos / 1e6);
  try {
    return new Date(ms).toISOString();
  } catch {
    return undefined;
  }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const ticketId = body.ticket_id ?? body.ticketId;
  const tier = body.tier;

  if (!ticketId || tier == null) {
    return NextResponse.json({ error: 'ticket_id and tier are required' }, { status: 400 });
  }

  const result = await protoUpgradeTicketSLA({
    ticketId: String(ticketId),
    tier: Number(tier),
  });

  if (!result.success || !result.response) {
    return NextResponse.json({ error: result.error || 'Failed to upgrade ticket SLA' }, { status: 500 });
  }

  const resp = result.response as Record<string, unknown>;

  return NextResponse.json({
    success: Boolean(resp.success ?? true),
    new_deadline: timestampToIso(resp.newDeadline ?? resp.new_deadline) ?? null,
    message: String(resp.message ?? ''),
  });
}
