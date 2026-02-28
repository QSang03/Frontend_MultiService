import { NextResponse } from 'next/server';
import { protoMarkMessagesAsRead } from '@/lib/proto/chat-client';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const roomId = body.room_id ?? body.roomId;

  if (!roomId) {
    return NextResponse.json({ error: 'room_id is required' }, { status: 400 });
  }

  const result = await protoMarkMessagesAsRead({ roomId: String(roomId) });

  if (!result.success || !result.response) {
    return NextResponse.json({ error: result.error || 'Failed to mark messages as read' }, { status: 500 });
  }

  const responseObj = result.response as Record<string, unknown>;
  return NextResponse.json({ success: Boolean(responseObj.success ?? true) });
}
