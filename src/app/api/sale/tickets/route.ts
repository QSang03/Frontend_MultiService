import { NextResponse } from 'next/server';
import { protoCreateTicket, protoListTickets, protoUpdateTicketStatus } from '@/lib/proto/ticket-client';

type TicketDto = {
  id: string;
  orgId?: string;
  categoryId?: string;
  serviceId?: string;
  title: string;
  status: number;
  priority?: string;
  attributes?: string;
  slaHours?: number;
  assetId?: string;
  createdAt?: string;
};

function mapPriorityToProto(priority: unknown): number {
  const normalized = String(priority ?? 'normal').trim().toLowerCase();
  if (normalized === 'low') return 1;
  if (normalized === 'high') return 3;
  if (normalized === 'critical' || normalized === 'urgent') return 4;
  return 2;
}

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
    orgId: obj.orgId == null ? undefined : String(obj.orgId),
    categoryId: obj.categoryId == null ? undefined : String(obj.categoryId),
    serviceId: obj.serviceId == null ? undefined : String(obj.serviceId),
    title: String(obj.title ?? ''),
    status: typeof statusRaw === 'number' ? statusRaw : Number(statusRaw) || 0,
    priority: obj.priority == null ? undefined : String(obj.priority),
    attributes: obj.attributes == null ? undefined : String(obj.attributes),
    slaHours: Number(obj.slaHours ?? 0) || undefined,
    assetId: obj.assetId == null ? undefined : String(obj.assetId),
    createdAt: timestampToIso(obj.createdAt ?? obj.created_at),
  };
}

function toStatusNumber(value: string): number | undefined {
  const normalized = value.trim().toUpperCase();
  if (!normalized) return undefined;
  if (normalized === 'DRAFT') return 1;
  if (normalized === 'AGREED') return 5;
  if (normalized === 'OPEN') return 3;
  if (normalized === 'IN_PROGRESS') return 7;
  if (normalized === 'RESOLVED') return 9;
  if (normalized === 'CLOSED') return 10;
  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? undefined : parsed;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ticketId = String(searchParams.get('ticket_id') ?? '').trim();
  const orgId = String(searchParams.get('org_id') ?? '').trim();
  const creatorId = String(searchParams.get('creator_id') ?? '').trim();
  const statusRaw = String(searchParams.get('status') ?? '').trim();
  const pageSizeRaw = String(searchParams.get('page_size') ?? '50').trim();
  const pageToken = String(searchParams.get('page_token') ?? '').trim();

  const status = toStatusNumber(statusRaw);
  const pageSize = Number(pageSizeRaw);

  const result = await protoListTickets({
    orgId: orgId || undefined,
    creatorId: creatorId || undefined,
    status,
    pageSize: Number.isNaN(pageSize) ? 50 : pageSize,
    pageToken,
  });

  if (!result.success || !result.response) {
    return NextResponse.json({ error: result.error || 'Failed to list tickets' }, { status: 500 });
  }

  const responseObj = result.response as Record<string, unknown>;
  const ticketsRaw = Array.isArray(responseObj.tickets) ? responseObj.tickets : [];
  const tickets = ticketsRaw.map((item) => normalizeTicket(item));
  const nextPageToken = String(responseObj.nextPageToken ?? responseObj.next_page_token ?? '');

  if (ticketId) {
    const ticket = tickets.find((item) => item.id === ticketId);
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found', tickets, next_page_token: nextPageToken }, { status: 404 });
    }
    return NextResponse.json({ ticket, tickets, next_page_token: nextPageToken });
  }

  return NextResponse.json({ tickets, next_page_token: nextPageToken });
}

export async function POST(req: Request) {
  const body = await req.json();
  const categoryId = body.category_id ?? body.categoryId;
  const serviceId = body.service_id ?? body.serviceId;
  const title = body.title;
  const description = body.description ?? '';
  const priority = body.priority ?? 'medium';
  const attributes = body.attributes ?? '{}';
  const assetId = body.asset_id ?? body.assetId;

  if (!categoryId || !title) {
    return NextResponse.json({ error: 'category_id and title are required' }, { status: 400 });
  }

  const result = await protoCreateTicket({
    categoryId: String(categoryId),
    serviceId: serviceId ? String(serviceId) : undefined,
    title: String(title),
    description: String(description),
    priority: mapPriorityToProto(priority),
    attributes: typeof attributes === 'string' ? attributes : JSON.stringify(attributes),
    assetId: assetId ? String(assetId) : undefined,
  });

  if (!result.success || !result.response) {
    return NextResponse.json({ error: result.error || 'Failed to create ticket' }, { status: 500 });
  }

  const resp = result.response as Record<string, unknown>;
  const ticket = normalizeTicket(resp.ticket);

  return NextResponse.json({ ticket }, { status: 201 });
}

export async function PUT(req: Request) {
  const body = await req.json().catch(() => ({}));
  const ticketId = body.ticket_id ?? body.ticketId;
  const status = body.status;

  if (!ticketId || status == null) {
    return NextResponse.json({ error: 'ticket_id and status are required' }, { status: 400 });
  }

  const result = await protoUpdateTicketStatus({
    ticketId: String(ticketId),
    status: Number(status),
  });

  if (!result.success || !result.response) {
    return NextResponse.json({ error: result.error || 'Failed to update ticket status' }, { status: 500 });
  }

  const resp = result.response as Record<string, unknown>;
  const ticket = normalizeTicket(resp.ticket);

  return NextResponse.json({ ticket });
}
