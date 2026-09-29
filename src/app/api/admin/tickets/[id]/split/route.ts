import { NextRequest, NextResponse } from 'next/server';
import {
  protoGetTeamSplit,
  protoUpdateTeamSplit,
  protoSubmitTechDispute,
  type TeamMemberSplitInput,
} from '@/lib/proto/ticket-client';

function safeBigIntToNumber(val?: bigint | number | string): number {
  if (val == null) return 0;
  if (typeof val === 'bigint') return Number(val);
  if (typeof val === 'number') return val;
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? 0 : parsed;
}

function mapSplitToDto(raw: unknown) {
  if (!raw) return null;
  const s = raw as Record<string, unknown>;
  const rawMembers = (s.members as unknown[]) || [];
  const members = rawMembers.map((m: unknown) => {
    const mem = m as Record<string, unknown>;
    return {
      techId: String(mem.techId || ''),
      techName: String(mem.techName || ''),
      role: String(mem.role || 'TECH'),
      timeMinutes: Number(mem.timeMinutes || 0),
      timePercentage: Number(mem.timePercentage || 0),
      effortScore: Number(mem.effortScore || 0),
      effortPercentage: Number(mem.effortPercentage || 0),
      leadRating: Number(mem.leadRating || 0),
      leadPercentage: Number(mem.leadPercentage || 0),
      finalPercentage: Number(mem.finalPercentage || 0),
      allocatedAmountCents: safeBigIntToNumber(mem.allocatedAmountCents as bigint),
    };
  });

  return {
    ticketId: String(s.ticketId || ''),
    techPoolCents: safeBigIntToNumber(s.techPoolCents as bigint),
    timeWeight: Number(s.timeWeight ?? 0.4),
    effortWeight: Number(s.effortWeight ?? 0.4),
    leadWeight: Number(s.leadWeight ?? 0.2),
    isLocked: Boolean(s.isLocked),
    reviewExpiresInSeconds: safeBigIntToNumber(s.reviewExpiresInSeconds as bigint),
    members,
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ticketId } = await params;
    if (!ticketId) {
      return NextResponse.json({ error: 'Ticket ID is required' }, { status: 400 });
    }

    const result = await protoGetTeamSplit(ticketId);
    if (!result.success || !result.response) {
      return NextResponse.json({ error: result.error || 'Failed to get team split' }, { status: 500 });
    }

    return NextResponse.json({
      split: mapSplitToDto(result.response),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ticketId } = await params;
    const body = await request.json();

    if (!body.members || !Array.isArray(body.members)) {
      return NextResponse.json({ error: 'members array is required' }, { status: 400 });
    }

    const members: TeamMemberSplitInput[] = body.members.map((m: Record<string, unknown>) => ({
      techId: String(m.techId || ''),
      techName: String(m.techName || ''),
      role: String(m.role || 'TECH'),
      timeMinutes: Number(m.timeMinutes || 0),
      effortScore: Number(m.effortScore || 0),
      leadRating: Number(m.leadRating || 0),
    }));

    const result = await protoUpdateTeamSplit({
      ticketId,
      members,
    });

    if (!result.success || !result.response) {
      return NextResponse.json({ error: result.error || 'Failed to update team split' }, { status: 500 });
    }

    const resp = result.response as Record<string, unknown>;
    return NextResponse.json({
      success: true,
      message: resp.message || 'Updated team split',
      split: mapSplitToDto(resp.teamSplit),
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
    const body = await request.json();

    if (!body.reason) {
      return NextResponse.json({ error: 'Dispute reason is required' }, { status: 400 });
    }

    const result = await protoSubmitTechDispute({
      ticketId,
      reason: body.reason,
    });

    if (!result.success || !result.response) {
      return NextResponse.json({ error: result.error || 'Failed to submit dispute' }, { status: 500 });
    }

    const resp = result.response as Record<string, unknown>;
    return NextResponse.json({
      success: true,
      message: resp.message || 'Dispute submitted successfully',
      disputeId: resp.disputeId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
