import { NextResponse } from 'next/server';
import { protoListTickets } from '@/lib/proto/ticket-client';

function mapStatusToTechStatus(statusNum?: number): 'NEW' | 'DISPATCHED' | 'IN PROGRESS' | 'COMPLETED' | 'CANCELLED' {
  switch (statusNum) {
    case 1:
      return 'NEW';
    case 2:
      return 'DISPATCHED';
    case 3:
      return 'IN PROGRESS';
    case 4:
    case 5:
      return 'COMPLETED';
    case 6:
      return 'CANCELLED';
    default:
      return 'NEW';
  }
}

function mapPriority(priority?: string): 'Low' | 'Medium' | 'High' | 'Critical' {
  const p = (priority || '').toLowerCase();
  if (p === 'critical' || p === 'urgent') return 'Critical';
  if (p === 'high') return 'High';
  if (p === 'low') return 'Low';
  return 'Medium';
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const pageSize = Number(searchParams.get('page_size') || '30');

    const result = await protoListTickets({ pageSize });
    if (!result.success || !result.response) {
      return NextResponse.json({ jobs: [] });
    }

    const resp = result.response as Record<string, unknown>;
    const tickets = (resp.tickets || []) as Record<string, unknown>[];

    const jobs = tickets.map((t) => {
      let attrs: Record<string, unknown> = {};
      try {
        if (typeof t.attributes === 'string') {
          attrs = JSON.parse(t.attributes);
        }
      } catch {
        // ignore parse error
      }

      const clientName = (attrs.customerName as string) || (attrs.companyName as string) || 'Khách hàng';
      const address = (attrs.address as string) || (attrs.location as string) || 'Chưa cập nhật địa chỉ';

      let dueDate = '24h SLA';
      if (t.targetResolutionAt) {
        dueDate = new Date(String(t.targetResolutionAt)).toLocaleString('vi-VN');
      } else if (t.createdAt) {
        dueDate = new Date(String(t.createdAt)).toLocaleString('vi-VN');
      }

      return {
        id: String(t.id || ''),
        title: String(t.title || 'Yêu cầu bảo trì kỹ thuật'),
        client: clientName,
        priority: mapPriority(t.priority as string),
        status: mapStatusToTechStatus(Number(t.status || 1)),
        address,
        distance: (attrs.distance as string) || '—',
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        dueDate,
        description: String(t.description || 'Xử lý sự cố kỹ thuật theo SLA cam kết.'),
        assignedTechId: t.assignedTechId ? String(t.assignedTechId) : undefined,
        createdAt: t.createdAt ? String(t.createdAt) : new Date().toISOString(),
        targetResolutionAt: t.targetResolutionAt ? String(t.targetResolutionAt) : undefined,
        rawAttributes: t.attributes ? String(t.attributes) : '{}',
        slaPaused: Boolean(attrs.slaPaused),
        slaPauseReason: attrs.slaPauseReason as string | undefined,
        slaPauseNotes: attrs.slaPauseNotes as string | undefined,
        slaPausedAt: attrs.slaPausedAt as string | undefined,
        slaTotalPausedMinutes: Number(attrs.slaTotalPausedMinutes || 0),
      };
    });

    return NextResponse.json({ jobs });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message, jobs: [] }, { status: 500 });
  }
}
