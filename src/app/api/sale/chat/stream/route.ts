import { protoStreamMessages } from '@/lib/proto/chat-client';

export const runtime = 'nodejs';

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
  const roomIdFilter = String(searchParams.get('room_id') ?? '').trim();

  const streamResult = await protoStreamMessages();
  if (!streamResult.success) {
    return new Response(JSON.stringify({ error: streamResult.error || 'Cannot start stream' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': ping\n\n'));
        } catch {
        }
      }, 20000);

      try {
        for await (const item of streamResult.stream) {
          if (req.signal.aborted) break;

          const raw = (item as Record<string, unknown>)?.message;
          if (!raw) continue;
          const normalized = normalizeMessage(raw);
          if (roomIdFilter && normalized.roomId !== roomIdFilter) {
            continue;
          }

          const data = `event: message\ndata: ${JSON.stringify(normalized)}\n\n`;
          controller.enqueue(encoder.encode(data));
        }
      } catch {
      } finally {
        clearInterval(heartbeat);
        try {
          controller.close();
        } catch {
        }
      }
    },
    cancel() {
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
