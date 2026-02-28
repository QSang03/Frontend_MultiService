import { NextResponse } from 'next/server';
import { protoGetTicketRoom } from '@/lib/proto/chat-client';

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

function normalizeMessage(raw: unknown) {
  const obj = (raw as Record<string, unknown>) || {};
  return {
    id: String(obj.id ?? ''),
    roomId: String(obj.roomId ?? obj.room_id ?? ''),
    senderId: String(obj.senderId ?? obj.sender_id ?? ''),
    messageType: Number(obj.messageType ?? obj.message_type ?? 0),
    content: String(obj.content ?? ''),
    metadata: obj.metadata == null ? '' : String(obj.metadata),
    createdAt: timestampToIso(obj.createdAt ?? obj.created_at),
  };
}

function normalizeRoom(raw: unknown) {
  const obj = (raw as Record<string, unknown>) || {};
  return {
    id: String(obj.id ?? ''),
    orgId: String(obj.orgId ?? obj.org_id ?? ''),
    roomType: Number(obj.roomType ?? obj.room_type ?? 0),
    ticketId: String(obj.ticketId ?? obj.ticket_id ?? ''),
    name: String(obj.name ?? ''),
    status: String(obj.status ?? ''),
    unreadCount: Number(obj.unreadCount ?? obj.unread_count ?? 0),
    createdAt: timestampToIso(obj.createdAt ?? obj.created_at),
    updatedAt: timestampToIso(obj.updatedAt ?? obj.updated_at),
    lastMessage: obj.lastMessage ? normalizeMessage(obj.lastMessage) : undefined,
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ticketId = String(searchParams.get('ticket_id') ?? '').trim();

  if (!ticketId) {
    return NextResponse.json({ error: 'ticket_id is required' }, { status: 400 });
  }

  const result = await protoGetTicketRoom({ ticketId });
  if (!result.success || !result.response) {
    return NextResponse.json({ error: result.error || 'Failed to get ticket room' }, { status: 500 });
  }

  const responseObj = result.response as Record<string, unknown>;
  const room = responseObj.room ? normalizeRoom(responseObj.room) : null;
  return NextResponse.json({ room });
}
