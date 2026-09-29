import { NextRequest, NextResponse } from 'next/server';
import { protoSmartAutoAssign } from '@/lib/proto/ticket-client';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ticketId } = await params;
    if (!ticketId) {
      return NextResponse.json({ error: 'Ticket ID is required' }, { status: 400 });
    }

    const result = await protoSmartAutoAssign({ ticketId });
    if (!result.success || !result.response) {
      return NextResponse.json(
        { error: result.error || 'Failed to calculate smart dispatch ranking' },
        { status: 500 }
      );
    }

    const resp = result.response as Record<string, unknown>;
    const rawCandidates = (resp.candidateRanking as unknown[]) || [];

    const candidates = rawCandidates.map((c: unknown) => {
      const cand = c as Record<string, unknown>;
      const name = String(cand.technicianName || 'Kỹ thuật viên');
      const initials = name
        .split(' ')
        .map((p) => p[0])
        .filter(Boolean)
        .slice(-2)
        .join('')
        .toUpperCase();

      return {
        technicianId: String(cand.technicianId || ''),
        technicianName: name,
        skillMatched: Boolean(cand.skillMatched),
        isOnline: Boolean(cand.isOnline),
        isAvailable: Boolean(cand.isAvailable),
        activeTicketsCount: Number(cand.activeTicketsCount || 0),
        compositeScore: Number(cand.compositeScore || 0),
        matchRationale: String(cand.matchRationale || ''),
        avatarText: initials || 'KT',
      };
    });

    return NextResponse.json({
      success: true,
      ticketId: resp.ticketId || ticketId,
      assignedTechnicianId: resp.assignedTechnicianId,
      assignedTechnicianName: resp.assignedTechnicianName,
      candidateRanking: candidates,
      message: resp.message || 'Calculated candidates',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ticketId } = await params;
    const body = await request.json().catch(() => ({}));
    const technicianId = body.technicianId as string | undefined;

    if (!ticketId) {
      return NextResponse.json({ error: 'Ticket ID is required' }, { status: 400 });
    }

    const result = await protoSmartAutoAssign({
      ticketId,
      forceOverrideTechnicianId: technicianId,
    });

    if (!result.success || !result.response) {
      return NextResponse.json(
        { error: result.error || 'Failed to dispatch ticket' },
        { status: 500 }
      );
    }

    const resp = result.response as Record<string, unknown>;
    return NextResponse.json({
      success: true,
      ticketId: resp.ticketId || ticketId,
      assignedTechnicianId: resp.assignedTechnicianId || technicianId,
      assignedTechnicianName: resp.assignedTechnicianName,
      message: resp.message || 'Ticket assigned successfully',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
