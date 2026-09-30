import { NextRequest, NextResponse } from 'next/server';
import { 
  protoAdminListUsers, 
  protoAdminCreateUser, 
  protoAdminUpdateUser, 
  protoAdminUpdateUserStatus 
} from '@/lib/proto/admin-client';
import { protoListTickets } from '@/lib/proto/ticket-client';

export async function GET() {
  try {
    const [userRes, ticketRes] = await Promise.all([
      protoAdminListUsers({ pageSize: 50 }).catch(() => ({ success: false, response: null })),
      protoListTickets({ pageSize: 100 }).catch(() => ({ success: false, response: null })),
    ]);

    const users =
      userRes.success && userRes.response && Array.isArray((userRes.response as Record<string, unknown>).users)
        ? ((userRes.response as Record<string, unknown>).users as Record<string, unknown>[])
        : [];

    const tickets =
      ticketRes.success && ticketRes.response && Array.isArray((ticketRes.response as Record<string, unknown>).tickets)
        ? ((ticketRes.response as Record<string, unknown>).tickets as Record<string, unknown>[])
        : [];

    const members = users.map((u, idx) => {
      const uId = String(u.id || '');
      const userTickets = tickets.filter((t) => String(t.creatorId || t.creator_id || '') === uId);
      const ticketsCount = userTickets.length;
      let totalSpent = 0;
      userTickets.forEach((t) => {
        if (t.attributes) {
          try {
            const p = JSON.parse(String(t.attributes));
            if (p.amount) totalSpent += Number(p.amount) || 0;
          } catch {}
        }
      });

      const roleStr = String(u.role || '').toLowerCase();
      const roleNum = Number(u.role);
      const isManager = roleStr.includes('manager') || roleNum === 3;
      const isAdmin = roleStr.includes('admin') || roleNum === 2;

      return {
        id: uId || `m-${idx + 1}`,
        name: String(u.fullName || u.email?.toString().split('@')[0] || 'Thành viên'),
        email: String(u.email || ''),
        phone: String(u.phone || '—'),
        dept: 'Khối Vận Hành',
        role: isAdmin ? 'admin' : isManager ? 'manager' : 'staff',
        roleLabel: isAdmin ? 'Admin' : isManager ? 'Manager' : 'Staff',
        status: u.isActive !== false ? 'active' : 'inactive',
        ticketsThisMonth: ticketsCount,
        totalSpent: totalSpent > 0 ? `${totalSpent.toLocaleString('vi-VN')}` : '0',
      };
    });

    return NextResponse.json({ success: true, members });
  } catch (err) {
    return NextResponse.json({ success: false, members: [], error: (err as Error).message });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, role, dept, password } = body;
    if (!email) {
      return NextResponse.json({ success: false, error: 'Email là bắt buộc' }, { status: 400 });
    }

    const roleMap: Record<string, number> = {
      admin: 2, // ORG_ADMIN
      manager: 3, // MANAGER
      staff: 4, // MEMBER
    };
    const roleNum = roleMap[String(role || 'staff').toLowerCase()] || 4;

    const res = await protoAdminCreateUser({
      email,
      phone: phone || '',
      fullName: name || email.split('@')[0],
      password: password || 'Welcome@123456',
      role: roleNum,
    });

    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error || 'Không thể tạo thành viên' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      member: {
        id: `m-${Date.now()}`,
        name: name || email.split('@')[0],
        email,
        phone: phone || '—',
        dept: dept || 'Khối Vận Hành',
        role: role || 'staff',
        roleLabel: role === 'admin' ? 'Admin' : role === 'manager' ? 'Manager' : 'Staff',
        status: 'active',
        ticketsThisMonth: 0,
        totalSpent: '0',
      },
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, action, isActive, role } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Thiếu userId' }, { status: 400 });
    }

    if (action === 'TOGGLE_STATUS') {
      const res = await protoAdminUpdateUserStatus({
        userId,
        isActive: Boolean(isActive),
      });
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error || 'Cập nhật trạng thái thất bại' }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: 'Cập nhật trạng thái thành công' });
    }

    if (action === 'UPDATE_ROLE') {
      const roleMap: Record<string, number> = {
        admin: 2,
        manager: 3,
        staff: 4,
      };
      const roleNum = roleMap[String(role).toLowerCase()] || 4;
      const res = await protoAdminUpdateUser({
        userId,
        role: roleNum,
      });
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error || 'Cập nhật vai trò thất bại' }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: 'Cập nhật vai trò thành công' });
    }

    return NextResponse.json({ success: false, error: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
