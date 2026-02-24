import { NextResponse } from 'next/server';
import { protoCreateTicket } from '@/lib/proto/ticket-client';

type TicketDto = {
  id: string;
  title: string;
  status: number;
  priority?: string;
  createdAt?: string;
};

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

function normalizeTicket(raw: unknown): TicketDto {
  const obj = (raw as Record<string, unknown>) || {};
  const statusRaw = obj.status ?? 0;

  return {
    id: String(obj.id ?? ''),
    title: String(obj.title ?? ''),
    status: typeof statusRaw === 'number' ? statusRaw : Number(statusRaw) || 0,
    priority: obj.priority == null ? undefined : String(obj.priority),
    createdAt: timestampToIso(obj.createdAt ?? obj.created_at),
  };
}

export async function POST(req: Request) {
  const body = await req.json();
  const categoryId = body.category_id ?? body.categoryId;
  const serviceId = body.service_id ?? body.serviceId;
  const title = body.title;
  const description = body.description ?? '';
  const priority = body.priority ?? 'medium';
  const attributes = body.attributes ?? '{}';

  if (!categoryId || !title) {
    return NextResponse.json({ error: 'category_id and title are required' }, { status: 400 });
  }

  const result = await protoCreateTicket({
    categoryId: String(categoryId),
    serviceId: serviceId ? String(serviceId) : undefined,
    title: String(title),
    description: String(description),
    priority: String(priority),
    attributes: typeof attributes === 'string' ? attributes : JSON.stringify(attributes),
  });

  if (!result.success || !result.response) {
    return NextResponse.json({ error: result.error || 'Failed to create ticket' }, { status: 500 });
  }

  const resp = result.response as Record<string, unknown>;
  const ticket = normalizeTicket(resp.ticket);

  return NextResponse.json({ ticket }, { status: 201 });
}
