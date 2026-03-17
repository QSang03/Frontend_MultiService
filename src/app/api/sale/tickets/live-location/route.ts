import { NextResponse } from 'next/server';
import { protoGetTicketLiveLocation } from '@/lib/proto/ticket-client';

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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ticketId = String(searchParams.get('ticket_id') ?? '').trim();

  if (!ticketId) {
    return NextResponse.json({ error: 'ticket_id is required' }, { status: 400 });
  }

  const result = await protoGetTicketLiveLocation({ ticketId });

  if (!result.success || !result.response) {
    return NextResponse.json({ error: result.error || 'Failed to get ticket live location' }, { status: 500 });
  }

  const resp = result.response as Record<string, unknown>;

  return NextResponse.json({
    latitude: Number(resp.latitude ?? 0),
    longitude: Number(resp.longitude ?? 0),
    timestamp: timestampToIso(resp.timestamp) ?? null,
  });
}
