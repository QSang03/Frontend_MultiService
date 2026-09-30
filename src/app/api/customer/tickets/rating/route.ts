import { NextResponse } from 'next/server';
import { protoSubmitTicketRating, protoGetTicketRating } from '@/lib/proto/ticket-client';
import { serializeBigInt } from '@/lib/api-utils';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { ticketId, stars, feedback, tags } = body;

    if (!ticketId || typeof stars !== 'number') {
      return NextResponse.json(
        { error: 'ticketId and numeric stars are required' },
        { status: 400 }
      );
    }

    const result = await protoSubmitTicketRating({
      ticketId: String(ticketId),
      stars: Math.max(1, Math.min(5, Math.round(stars))),
      feedback: feedback ? String(feedback).trim() : undefined,
      tags: Array.isArray(tags) ? tags.map(String) : [],
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to submit ticket rating' },
        { status: 500 }
      );
    }

    const resp = result.response as Record<string, unknown>;
    return NextResponse.json({
      success: true,
      data: serializeBigInt(resp),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ticketId = searchParams.get('ticketId') || searchParams.get('ticket_id');

    if (!ticketId) {
      return NextResponse.json(
        { error: 'ticketId parameter is required' },
        { status: 400 }
      );
    }

    const result = await protoGetTicketRating(String(ticketId));

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to get ticket rating' },
        { status: 500 }
      );
    }

    const resp = result.response as Record<string, unknown>;
    return NextResponse.json({
      success: true,
      data: serializeBigInt(resp),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
