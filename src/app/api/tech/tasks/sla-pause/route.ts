import { NextResponse } from 'next/server';
import { protoUpdateTicketAttributes, protoUpdateTicketStatus } from '@/lib/proto/ticket-client';

export type SlaPauseReason = 'PENDING_CUSTOMER' | 'PENDING_PARTS' | 'SCHEDULED';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { ticketId, action, reason, notes, currentAttributes } = body;

    if (!ticketId) {
      return NextResponse.json({ error: 'Missing ticketId' }, { status: 400 });
    }

    if (action !== 'PAUSE' && action !== 'RESUME') {
      return NextResponse.json({ error: 'Invalid action. Must be PAUSE or RESUME' }, { status: 400 });
    }

    let parsedAttrs: Record<string, unknown> = {};
    if (typeof currentAttributes === 'string') {
      try {
        parsedAttrs = JSON.parse(currentAttributes);
      } catch {
        parsedAttrs = {};
      }
    } else if (typeof currentAttributes === 'object' && currentAttributes !== null) {
      parsedAttrs = { ...currentAttributes };
    }

    const now = new Date();

    if (action === 'PAUSE') {
      if (!reason || !['PENDING_CUSTOMER', 'PENDING_PARTS', 'SCHEDULED'].includes(reason)) {
        return NextResponse.json(
          { error: 'Lý do tạm dừng không hợp lệ (Phải là PENDING_CUSTOMER, PENDING_PARTS, hoặc SCHEDULED)' },
          { status: 400 }
        );
      }

      parsedAttrs.slaPaused = true;
      parsedAttrs.slaPauseReason = reason;
      parsedAttrs.slaPauseNotes = notes || '';
      parsedAttrs.slaPausedAt = now.toISOString();

      const attrRes = await protoUpdateTicketAttributes({
        ticketId,
        attributes: JSON.stringify(parsedAttrs),
      });

      // Update status to PENDING (e.g., status 6 in multi-service enum or custom)
      await protoUpdateTicketStatus({ ticketId, status: 6 }).catch(() => {
        // Status update is non-critical if attributes are saved
      });

      if (!attrRes.success) {
        return NextResponse.json({ error: attrRes.error || 'Failed to pause SLA in backend' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        action: 'PAUSE',
        slaPaused: true,
        slaPauseReason: reason,
        slaPauseNotes: notes || '',
        slaPausedAt: parsedAttrs.slaPausedAt,
        slaTotalPausedMinutes: Number(parsedAttrs.slaTotalPausedMinutes || 0),
        message: 'Đã tạm dừng đếm ngược SLA thành công (Stop-the-Clock Active)',
      });
    } else {
      // RESUME SLA
      const pausedAtStr = parsedAttrs.slaPausedAt as string | undefined;
      let additionalMinutes = 0;
      if (pausedAtStr) {
        const pausedTime = new Date(pausedAtStr).getTime();
        if (!isNaN(pausedTime) && pausedTime < now.getTime()) {
          additionalMinutes = Math.round((now.getTime() - pausedTime) / 60000);
        }
      }

      const totalPaused = Number(parsedAttrs.slaTotalPausedMinutes || 0) + additionalMinutes;
      parsedAttrs.slaPaused = false;
      parsedAttrs.slaResumedAt = now.toISOString();
      parsedAttrs.slaResumeNotes = notes || '';
      parsedAttrs.slaTotalPausedMinutes = totalPaused;

      const attrRes = await protoUpdateTicketAttributes({
        ticketId,
        attributes: JSON.stringify(parsedAttrs),
      });

      // Update status back to IN PROGRESS (status 3)
      await protoUpdateTicketStatus({ ticketId, status: 3 }).catch(() => {
        // Non-critical status fallback
      });

      if (!attrRes.success) {
        return NextResponse.json({ error: attrRes.error || 'Failed to resume SLA in backend' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        action: 'RESUME',
        slaPaused: false,
        slaPauseReason: null,
        slaPausedAt: null,
        slaResumedAt: parsedAttrs.slaResumedAt,
        slaTotalPausedMinutes: totalPaused,
        message: `Đã khôi phục đếm ngược SLA. Tổng thời gian tạm dừng tích lũy: ${totalPaused} phút.`,
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
