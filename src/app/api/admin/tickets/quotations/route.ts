import { NextResponse } from 'next/server';
import {
  protoSubmitQuotation,
  protoAcceptQuotation,
  protoRejectQuotation,
} from '@/lib/proto/ticket-client';
import { protoListQuotations } from '@/lib/proto/quotation-client';

export type QuotationDto = {
  id: string;
  ticketId?: string;
  creatorId?: string;
  totalAmount?: string;
  taxAmount?: string;
  currency?: string;
  note?: string;
  isAccepted?: boolean;
  items?: string;
  createdAt?: string;
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

function normalizeQuotation(s: unknown): QuotationDto {
  const obj = (s as Record<string, unknown>) || {};
  const id = String(obj.id ?? '');
  const ticketId = obj.ticketId ?? obj.ticket_id;
  const creatorId = obj.creatorId ?? obj.creator_id;
  const totalAmount = obj.totalAmount ?? obj.total_amount;
  const taxAmount = obj.taxAmount ?? obj.tax_amount;
  const currency = obj.currency;
  const note = obj.note;
  const items = obj.items;
  const createdAt = timestampToIso(obj.createdAt ?? obj.created_at);

  // Determine isAccepted from either TicketQuotation.is_accepted (bool) or QuotationService.status (enum)
  // QuotationStatus: DRAFT=1, SENT=2, REVIEWED=3, ACCEPTED=4, REJECTED=5
  const status = Number(obj.status ?? 0);
  const isAcceptedRaw = obj.isAccepted ?? obj.is_accepted;
  let isAccepted: boolean | undefined;
  if (status === 4) isAccepted = true;
  else if (status === 5) isAccepted = false;
  else if (isAcceptedRaw === true) isAccepted = true;
  else if (isAcceptedRaw != null && status > 0) isAccepted = undefined; // pending
  else isAccepted = undefined;

  return {
    id,
    ticketId: ticketId == null ? undefined : String(ticketId),
    creatorId: creatorId == null ? undefined : String(creatorId),
    totalAmount: totalAmount == null ? undefined : String(totalAmount),
    taxAmount: taxAmount == null ? undefined : String(taxAmount),
    currency: currency == null ? undefined : String(currency),
    note: note == null ? undefined : String(note),
    isAccepted,
    items: items == null ? undefined : String(items),
    createdAt,
  };
}

// GET - List quotations (filter by ticket_id on client side)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ticketId = String(searchParams.get('ticket_id') ?? '').trim();

  const result = await protoListQuotations({ pageSize: 100 });
  if (!result.success || !result.response) {
    return NextResponse.json({ error: result.error || 'Failed to list quotations' }, { status: 500 });
  }

  const resp = result.response as Record<string, unknown>;
  const quotationsRaw = Array.isArray(resp.quotations) ? resp.quotations : [];
  const quotations = quotationsRaw.map((q) => normalizeQuotation(q));

  if (ticketId) {
    const match = quotations.find((q) => q.ticketId === ticketId);
    return NextResponse.json({ quotation: match ?? null });
  }

  return NextResponse.json({ quotations });
}

// POST - Submit a new quotation
export async function POST(req: Request) {
  const body = await req.json();
  const ticketId = body.ticket_id ?? body.ticketId;
  const totalAmount = body.total_amount ?? body.totalAmount ?? '0';
  const taxAmount = body.tax_amount ?? body.taxAmount ?? '0';
  const currency = body.currency ?? 'VND';
  const note = body.note ?? '';
  const items = body.items ?? '[]';

  if (!ticketId) {
    return NextResponse.json({ error: 'ticket_id is required' }, { status: 400 });
  }

  const result = await protoSubmitQuotation({
    ticketId,
    totalAmount: String(totalAmount),
    taxAmount: String(taxAmount),
    currency,
    note,
    items: typeof items === 'string' ? items : JSON.stringify(items),
  });

  if (!result.success || !result.response) {
    return NextResponse.json({ error: result.error || 'Failed to submit quotation' }, { status: 500 });
  }

  const resp = result.response as Record<string, unknown>;
  const quotation = normalizeQuotation(resp.quotation);

  return NextResponse.json({ quotation }, { status: 201 });
}

// PUT - Accept or reject quotation
export async function PUT(req: Request) {
  const body = await req.json();
  const quotationId = body.quotation_id ?? body.quotationId;
  const action = body.action; // 'accept' | 'reject'

  if (!quotationId) {
    return NextResponse.json({ error: 'quotation_id is required' }, { status: 400 });
  }

  let result: { success: boolean; response?: unknown; error?: string };

  switch (action) {
    case 'accept': {
      result = await protoAcceptQuotation({ quotationId });
      break;
    }
    case 'reject': {
      const reason = body.reason ?? '';
      result = await protoRejectQuotation({ quotationId, reason });
      break;
    }
    default:
      return NextResponse.json({ error: 'Invalid action. Use: accept, reject' }, { status: 400 });
  }

  if (!result.success || !result.response) {
    return NextResponse.json({ error: result.error || 'Failed to process quotation' }, { status: 500 });
  }

  const resp = result.response as Record<string, unknown>;
  const quotation = normalizeQuotation(resp.quotation);

  return NextResponse.json({ quotation });
}
