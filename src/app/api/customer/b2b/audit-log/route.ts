import { NextResponse } from 'next/server';
import { protoListTickets } from '@/lib/proto/ticket-client';

export async function GET() {
  try {
    const ticketRes = await protoListTickets({ pageSize: 50 }).catch(() => ({ success: false, response: null }));
    const tickets =
      ticketRes.success && ticketRes.response && Array.isArray((ticketRes.response as Record<string, unknown>).tickets)
        ? ((ticketRes.response as Record<string, unknown>).tickets as Record<string, unknown>[])
        : [];

    const entries = tickets.map((t, idx) => {
      const id = String(t.id || '');
      const title = String(t.title || 'Yêu cầu hỗ trợ IT');
      const createdAt = t.createdAt ? new Date(String(t.createdAt)) : new Date();
      const timeStr = createdAt.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });

      const statusNum = Number(t.status || 1);
      let action = 'Tạo Ticket mới';
      let actionType: 'approval' | 'config' | 'member' | 'finance' | 'ticket' = 'ticket';
      let oldValue = '—';
      let newValue = 'Created';

      if (statusNum === 3) {
        action = 'Tiếp nhận xử lý';
        actionType = 'ticket';
        oldValue = 'Pending';
        newValue = 'Open';
      } else if (statusNum === 5) {
        action = 'Duyệt báo giá';
        actionType = 'approval';
        oldValue = 'Quotation';
        newValue = 'Agreed';
      } else if (statusNum === 7) {
        action = 'Phân công kỹ thuật viên';
        actionType = 'member';
        oldValue = 'Unassigned';
        newValue = 'In Progress';
      } else if (statusNum >= 9) {
        action = 'Nghiệm thu hoàn tất';
        actionType = 'approval';
        oldValue = 'In Progress';
        newValue = 'Resolved';
      }

      return {
        id: `aud-${idx + 1}`,
        time: timeStr,
        user: String(t.creatorId || 'Khách hàng B2B'),
        action,
        actionType,
        target: `#${id.slice(-6)}`,
        targetTitle: title,
        oldValue,
        newValue,
      };
    });

    return NextResponse.json({ success: true, entries });
  } catch (error) {
    return NextResponse.json({ success: false, entries: [] });
  }
}
