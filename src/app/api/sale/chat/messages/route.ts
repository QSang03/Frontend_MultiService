import { NextResponse } from 'next/server';
import { protoGetChatMessages, protoSendMessage } from '@/lib/proto/chat-client';

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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const roomId = String(searchParams.get('room_id') ?? '').trim();
  const pageSizeRaw = String(searchParams.get('page_size') ?? '50').trim();
  const pageToken = String(searchParams.get('page_token') ?? '').trim();

  if (!roomId) {
    return NextResponse.json({ error: 'room_id is required' }, { status: 400 });
  }

  const pageSize = Number(pageSizeRaw);

  const result = await protoGetChatMessages({
    roomId,
    pageSize: Number.isNaN(pageSize) ? 50 : pageSize,
    pageToken,
  });

  if (!result.success || !result.response) {
    return NextResponse.json({ error: result.error || 'Failed to get chat messages' }, { status: 500 });
  }

  const responseObj = result.response as Record<string, unknown>;
  const messagesRaw = Array.isArray(responseObj.messages) ? responseObj.messages : [];
  const messages = messagesRaw.map((item) => normalizeMessage(item));
  const nextPageToken = String(responseObj.nextPageToken ?? responseObj.next_page_token ?? '');

  return NextResponse.json({ messages, next_page_token: nextPageToken });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const roomId = body.room_id ?? body.roomId;
  const messageType = body.message_type ?? body.messageType ?? 'text';
  const content = body.content;
  const metadata = body.metadata ?? '';

  if (!roomId || !content) {
    return NextResponse.json({ error: 'room_id and content are required' }, { status: 400 });
  }

  const result = await protoSendMessage({
    roomId: String(roomId),
    messageType,
    content: String(content),
    metadata: String(metadata),
  });

  if (!result.success || !result.response) {
    return NextResponse.json({ error: result.error || 'Failed to send message' }, { status: 500 });
  }

  const responseObj = result.response as Record<string, unknown>;
  const message = responseObj.message ? normalizeMessage(responseObj.message) : null;

  return NextResponse.json({ message }, { status: 201 });
}
