import { NextResponse } from 'next/server';
import { protoStartJob } from '@/lib/proto/ticket-client';
import { serializeBigInt } from '@/lib/api-utils';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { ticketId, estimatedDurationMinutes, notes } = body;

    if (!ticketId || typeof estimatedDurationMinutes !== 'number') {
      return NextResponse.json(
        { error: 'ticketId and numeric estimatedDurationMinutes are required' },
        { status: 400 }
      );
    }

    const result = await protoStartJob({
      ticketId: String(ticketId),
      estimatedDurationMinutes: Math.max(1, Math.round(estimatedDurationMinutes)),
      notes: notes ? String(notes).trim() : undefined,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to start job' },
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
