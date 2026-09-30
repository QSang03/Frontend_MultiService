import { protoStreamNotifications } from '@/lib/proto/notification-client';

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

function normalizeNotification(raw: unknown) {
  const obj = (raw as Record<string, unknown>) || {};
  return {
    id: String(obj.id ?? ''),
    userId: String(obj.userId ?? obj.user_id ?? ''),
    title: String(obj.title ?? ''),
    content: String(obj.content ?? ''),
    type: String(obj.type ?? ''),
    referenceId: String(obj.referenceId ?? obj.reference_id ?? ''),
    isRead: Boolean(obj.isRead ?? obj.is_read ?? false),
    createdAt: timestampToIso(obj.createdAt ?? obj.created_at) || new Date().toISOString(),
  };
}

export async function GET(req: Request) {
  const encoder = new TextEncoder();
  const abortController = new AbortController();

  req.signal.addEventListener('abort', () => {
    abortController.abort();
  });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': ping\n\n'));
        } catch {
          clearInterval(heartbeat);
        }
      }, 15000);

      try {
        const notifStream = protoStreamNotifications(abortController.signal);
        for await (const notif of notifStream) {
          const payload = normalizeNotification(notif);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        }
      } catch (err) {
        console.error('Notification stream error:', err);
      } finally {
        clearInterval(heartbeat);
        try {
          controller.close();
        } catch {
        }
      }
    },
    cancel() {
      abortController.abort();
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
