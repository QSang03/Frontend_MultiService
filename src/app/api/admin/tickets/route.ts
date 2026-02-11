import { NextResponse } from 'next/server';
import {
  protoUpdateTicketStatus,
  protoAssignTicket,
  protoApproveTicket,
  protoRejectTicket,
  protoListTickets,
} from '@/lib/proto/ticket-client';

export type TicketDto = {
  id: string;
  orgId?: string;
  creatorId?: string;
  departmentId?: string;
  categoryId?: string;
  serviceId?: string;
  title: string;
  description?: string;
  status: number;
  priority?: string;
  assignedTechId?: string;
  assignedSaleId?: string;
  attributes?: string;
  createdAt?: string;
  updatedAt?: string;
  resolvedAt?: string;
  closedAt?: string;
  targetResponseAt?: string;
  targetResolutionAt?: string;
  slaHours?: number;
};

function timestampToIso(ts?: unknown): string | undefined {
  if (!ts) return undefined;
  const t = ts as Record<string, unknown>;
  const secondsField = t['seconds'];
  const secondsRaw = (secondsField == null)
    ? undefined
    : (typeof secondsField === 'number' || typeof secondsField === 'string' ? secondsField : String(secondsField));
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

function normalizeTicket(s: unknown): TicketDto {
  const obj = (s as Record<string, unknown>) || {};
  const id = String(obj.id ?? '');
  const orgId = obj.orgId ?? obj.org_id;
  const creatorId = obj.creatorId ?? obj.creator_id;
  const departmentId = obj.departmentId ?? obj.department_id;
  const categoryId = obj.categoryId ?? obj.category_id;
  const serviceId = obj.serviceId ?? obj.service_id;
  const title = String(obj.title ?? '');
  const description = obj.description == null ? undefined : String(obj.description);
  const statusRaw = obj.status ?? 0;
  const status = typeof statusRaw === 'number' ? statusRaw : Number(statusRaw) || 0;
  const priority = obj.priority == null ? undefined : String(obj.priority);
  const assignedTechId = obj.assignedTechId ?? obj.assigned_tech_id;
  const assignedSaleId = obj.assignedSaleId ?? obj.assigned_sale_id;
  const attributes = obj.attributes == null ? undefined : String(obj.attributes);
  const slaHours = Number(obj.slaHours ?? obj.sla_hours ?? 0);

  const createdAt = timestampToIso(obj.createdAt ?? obj.created_at);
  const updatedAt = timestampToIso(obj.updatedAt ?? obj.updated_at);
  const resolvedAt = timestampToIso(obj.resolvedAt ?? obj.resolved_at);
  const closedAt = timestampToIso(obj.closedAt ?? obj.closed_at);
  const targetResponseAt = timestampToIso(obj.targetResponseAt ?? obj.target_response_at);
  const targetResolutionAt = timestampToIso(obj.targetResolutionAt ?? obj.target_resolution_at);

  return {
    id,
    orgId: orgId == null ? undefined : String(orgId),
    creatorId: creatorId == null ? undefined : String(creatorId),
    departmentId: departmentId == null ? undefined : String(departmentId),
    categoryId: categoryId == null ? undefined : String(categoryId),
    serviceId: serviceId == null ? undefined : String(serviceId),
    title,
    description,
    status,
    priority,
    assignedTechId: assignedTechId == null ? undefined : String(assignedTechId),
    assignedSaleId: assignedSaleId == null ? undefined : String(assignedSaleId),
    attributes,
    createdAt,
    updatedAt,
    resolvedAt,
    closedAt,
    targetResponseAt,
    targetResolutionAt,
    slaHours,
  };
}

// GET - List tickets or filter by params
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const pageSize = Number(searchParams.get('page_size') || '50');
  const pageToken = searchParams.get('page_token') || '';
  const orgId = searchParams.get('org_id') || undefined;
  const creatorId = searchParams.get('creator_id') || undefined;
  const statusStr = searchParams.get('status');
  const status = statusStr ? Number(statusStr) : undefined;

  const result = await protoListTickets({
    pageSize,
    pageToken,
    orgId,
    creatorId,
    status,
  });

  if (!result.success || !result.response) {
    return NextResponse.json({ error: result.error || 'Failed to list tickets' }, { status: 500 });
  }

  const resp = result.response as Record<string, unknown>;
  const ticketsRaw = (resp.tickets ?? []) as unknown[];
  const tickets = Array.isArray(ticketsRaw) ? ticketsRaw.map(normalizeTicket) : [];
  const nextPageToken = String(resp.nextPageToken ?? resp.next_page_token ?? '');

  return NextResponse.json({ tickets, nextPageToken });
}

// POST - Admins are not allowed to create tickets
export async function POST() {
  return NextResponse.json(
    { error: 'Admin is not allowed to create tickets' },
    { status: 403 }
  );
}

// PUT - Update ticket (status, assign, approve, reject)
export async function PUT(req: Request) {
  const body = await req.json();
  const ticketId = body.ticket_id ?? body.ticketId;
  const action = body.action; // 'update_status' | 'assign' | 'approve' | 'reject'

  if (!ticketId) {
    return NextResponse.json({ error: 'ticket_id is required' }, { status: 400 });
  }

  let result: { success: boolean; response?: unknown; error?: string };

  switch (action) {
    case 'update_status': {
      const status = body.status;
      if (status == null) {
        return NextResponse.json({ error: 'status is required for update_status action' }, { status: 400 });
      }
      result = await protoUpdateTicketStatus({ ticketId, status: Number(status) });
      break;
    }
    case 'assign': {
      const techId = body.tech_id ?? body.techId;
      const saleId = body.sale_id ?? body.saleId;
      result = await protoAssignTicket({ ticketId, techId, saleId });
      break;
    }
    case 'approve': {
      result = await protoApproveTicket({ ticketId });
      break;
    }
    case 'reject': {
      const reason = body.reason ?? '';
      result = await protoRejectTicket({ ticketId, reason });
      break;
    }
    default:
      return NextResponse.json({ error: 'Invalid action. Use: update_status, assign, approve, reject' }, { status: 400 });
  }

  if (!result.success || !result.response) {
    return NextResponse.json({ error: result.error || 'Failed to update ticket' }, { status: 500 });
  }

  const resp = result.response as Record<string, unknown>;
  const ticket = normalizeTicket(resp.ticket);

  return NextResponse.json({ ticket });
}
