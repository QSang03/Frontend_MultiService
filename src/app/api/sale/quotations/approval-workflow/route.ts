import { NextResponse } from 'next/server';
import { protoGetTicketApprovalWorkflow } from '@/lib/proto/ticket-client';
import { serializeBigInt } from '@/lib/api-utils';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ticketId = searchParams.get('ticket_id') ?? '';

  if (!ticketId) {
    return NextResponse.json({ error: 'ticket_id is required' }, { status: 400 });
  }

  const result = await protoGetTicketApprovalWorkflow({
    ticketId: String(ticketId),
  });

  if (!result.success || !result.response) {
    return NextResponse.json({ error: result.error || 'GetTicketApprovalWorkflow failed' }, { status: 500 });
  }

  const resp = result.response as Record<string, unknown>;
  const steps = Array.isArray(resp.steps) ? resp.steps.map((s: unknown) => serializeBigInt(s)) : [];
  return NextResponse.json({ steps });
}
