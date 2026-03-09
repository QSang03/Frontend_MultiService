import { NextResponse } from 'next/server';
import { protoListTicketActivities } from '@/lib/proto/ticket-client';
import { serializeBigInt } from '@/lib/api-utils';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ticketId = searchParams.get('ticket_id') ?? '';
  const pageSize = parseInt(searchParams.get('page_size') ?? '20', 10);
  const pageToken = searchParams.get('page_token') ?? '';

  if (!ticketId) {
    return NextResponse.json({ error: 'ticket_id is required' }, { status: 400 });
  }

  const result = await protoListTicketActivities({
    ticketId: String(ticketId),
    pageSize: Number.isFinite(pageSize) ? pageSize : 20,
    pageToken,
  });

  if (!result.success || !result.response) {
    return NextResponse.json({ error: result.error || 'ListTicketActivities failed' }, { status: 500 });
  }

  const resp = result.response as Record<string, unknown>;
  const activities = Array.isArray(resp.activities)
    ? resp.activities.map((a: unknown) => serializeBigInt(a))
    : [];
  return NextResponse.json({
    activities,
    next_page_token: String(resp.nextPageToken ?? resp.next_page_token ?? ''),
    total_count: Number(resp.totalCount ?? resp.total_count ?? 0),
  });
}
