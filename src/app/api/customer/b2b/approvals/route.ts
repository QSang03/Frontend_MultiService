import { NextRequest, NextResponse } from 'next/server';
import { protoApproveTicket, protoListTickets } from '@/lib/proto/ticket-client';

// In-memory approvals for demo/fallback when proto service is offline
const memoryApprovals = [
  { id: 'app-1', ticketId: 'T-0055', title: 'Nâng cấp RAM 5 máy tính phòng Dev', creator: 'Nguyễn Văn B', dept: 'IT', amount: 5000000, costCenter: 'IT Department', sla: 'Medium (24h)', remainingBudget: 8500000, date: '14/03', level: 1, status: 'PENDING_MANAGER' },
  { id: 'app-2', ticketId: 'T-0057', title: 'Mua license Microsoft 365 (10 seats)', creator: 'Lê Thị D', dept: 'HR', amount: 3200000, costCenter: 'HR & Admin', sla: 'Low (72h)', remainingBudget: 7200000, date: '15/03', level: 1, status: 'PENDING_MANAGER' },
  { id: 'app-3', ticketId: 'T-0058', title: 'Bảo trì máy chủ Core hàng quý', creator: 'Phạm Hải', dept: 'IT', amount: 12000000, costCenter: 'IT Department', sla: 'Medium (24h)', remainingBudget: 8500000, date: '15/03', level: 2, status: 'PENDING_ADMIN' },
];

export async function GET() {
  try {
    // Attempt proto list with pending approval status
    const protoRes = await protoListTickets({ status: 2 });
    if (protoRes.success && (protoRes.response as Record<string, unknown>)?.tickets) {
      return NextResponse.json({
        success: true,
        data: (protoRes.response as Record<string, unknown>).tickets,
      });
    }
    return NextResponse.json({ success: true, data: memoryApprovals });
  } catch {
    return NextResponse.json({ success: true, data: memoryApprovals });
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
      // Remove from memory approvals if present
      const idx = memoryApprovals.findIndex((a) => a.ticketId === ticketId);
      if (idx !== -1) memoryApprovals.splice(idx, 1);

      return NextResponse.json({
        success: true,
        message: `Đã duyệt ticket #${ticketId}${note ? ` (Ghi chú: ${note})` : ''}`,
        protoResult: res,
      });
    } else {
      // Reject
      const idx = memoryApprovals.findIndex((a) => a.ticketId === ticketId);
      if (idx !== -1) memoryApprovals.splice(idx, 1);

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
