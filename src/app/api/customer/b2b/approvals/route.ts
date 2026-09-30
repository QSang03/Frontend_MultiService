import { NextRequest, NextResponse } from 'next/server';
import { protoApproveTicket, protoRejectTicket, protoListTickets } from '@/lib/proto/ticket-client';
import { listCostCenters } from '@/lib/proto/tenant-client';

export async function GET() {
  try {
    // List tickets pending approval and cost centers concurrently
    const [protoRes, costCenters] = await Promise.all([
      protoListTickets({ status: 1, pageSize: 50 }).catch(() => ({ success: false, response: null })),
      listCostCenters('org-b2b-default', false).catch(() => []),
    ]);

    let tickets: Record<string, unknown>[] = [];

    if (protoRes.success && (protoRes.response as Record<string, unknown>)?.tickets) {
      tickets = (protoRes.response as Record<string, unknown>).tickets as Record<string, unknown>[];
    } else {
      // Also try listing general tickets
      const allRes = await protoListTickets({ pageSize: 50 }).catch(() => ({ success: false, response: null }));
      if (allRes.success && (allRes.response as Record<string, unknown>)?.tickets) {
        const allTickets = (allRes.response as Record<string, unknown>).tickets as Record<string, unknown>[];
        // Filter tickets that need approval (status <= 2)
        tickets = allTickets.filter((t) => Number(t.status) <= 2);
      }
    }

    if (tickets.length > 0) {
      const realApprovals = tickets.map((t, idx) => {
        const priorityNum = Number(t.priority || 2);
        const slaText =
          priorityNum >= 4
            ? 'Critical (4h)'
            : priorityNum === 3
            ? 'High (8h)'
            : priorityNum === 2
            ? 'Medium (24h)'
            : 'Low (72h)';
        const idStr = String(t.id || '');

        // Extract real cost from ticket attributes or estimatedCost
        let ticketAmount = 0;
        if (t.estimatedCost) {
          ticketAmount = Number(t.estimatedCost) || 0;
        } else if (t.attributes) {
          try {
            const parsed = typeof t.attributes === 'string' ? JSON.parse(t.attributes) : (t.attributes as Record<string, unknown>);
            ticketAmount = Number(parsed.amount || parsed.estimatedPrice || parsed.totalPrice) || 0;
          } catch {}
        }

        // Match cost center
        const cc = costCenters.find((c) => c.id === t.costCenterId || c.code === t.costCenterCode) || costCenters[0];
        const remainingBudget = cc ? Math.max(0, cc.allocatedBudget - cc.currentSpent) : 0;
        const costCenterName = cc ? `${cc.code} - ${cc.name}` : String(t.costCenterName || 'Trung tâm Chi phí IT');

        return {
          id: idStr || `app-${idx + 1}`,
          ticketId: idStr,
          title: String(t.title || 'Yêu cầu dịch vụ CNTT'),
          creator: String(t.creatorName || t.creatorEmail || 'Nhân viên'),
          dept: String(t.departmentName || 'Phòng Kỹ thuật & Vận hành'),
          amount: ticketAmount,
          costCenter: costCenterName,
          sla: slaText,
          remainingBudget: remainingBudget,
          date: t.createdAt ? new Date(String(t.createdAt)).toLocaleDateString('vi-VN') : 'Hôm nay',
          level: priorityNum >= 3 ? 2 : 1,
          status: 'PENDING_APPROVAL',
        };
      });

      return NextResponse.json({ success: true, data: realApprovals });
    }

    return NextResponse.json({ success: true, data: [] });
  } catch {
    return NextResponse.json({ success: true, data: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ticketId, action, note } = body;
    if (!ticketId || !action) {
      return NextResponse.json({ success: false, error: 'Thiếu ticketId hoặc action' }, { status: 400 });
    }

    if (action === 'approve') {
      const res = await protoApproveTicket({ ticketId });
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error || 'Duyệt ticket thất bại' }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        message: `Đã duyệt ticket #${ticketId}${note ? ` (Ghi chú: ${note})` : ''}`,
        protoResult: res,
      });
    } else {
      const res = await protoRejectTicket({
        ticketId,
        reason: note || 'Từ chối bởi cấp quản lý B2B',
      });
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error || 'Từ chối ticket thất bại' }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        message: `Đã từ chối ticket #${ticketId}${note ? ` (Lý do: ${note})` : ''}`,
      });
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
