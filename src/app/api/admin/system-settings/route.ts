import { NextRequest, NextResponse } from 'next/server';
import { protoAdminListUsers } from '@/lib/proto/admin-client';
import { protoListTickets } from '@/lib/proto/ticket-client';

export interface TechnicianLocation {
  id: string;
  name: string;
  phone?: string;
  lat: number;
  lng: number;
  status: 'available' | 'critical' | 'on_site' | 'busy';
  color: string;
  currentTicket?: string;
  assignedArea?: string;
}

export interface PendingDispatchTicket {
  id: string;
  ticketCode: string;
  location: string;
  title: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  priorityColor: string;
  timeAgo: string;
}

export interface AuditLogItem {
  id: string;
  type: string;
  description: string;
  before?: string;
  after?: string;
  actor: string;
  timestamp: string;
  time: string;
}

export interface NotificationChannelStatus {
  id: string;
  name: string;
  type: 'sms' | 'email' | 'push';
  usage: string;
  quota: string;
  status: 'Connected' | 'Warning' | 'Disconnected';
  statusColor: string;
}

export interface SlaStopClockRule {
  id: string;
  name: string;
  label: string;
  days: number;
  description: string;
}

// In-memory runtime state for system settings
let isMaintenanceMode = false;
let slaStopClockRules: SlaStopClockRule[] = [
  { id: '1', name: 'Pending Customer (Chờ phản hồi từ khách)', label: 'STOP CLOCK', days: 3, description: 'Đóng băng SLA khi chờ khách hàng xác nhận báo giá hoặc mật khẩu máy.' },
  { id: '2', name: 'Pending Vendor (Chờ bảo hành linh kiện)', label: 'STOP CLOCK', days: 15, description: 'Đóng băng SLA khi linh kiện được gửi về hãng/Vendor RMA.' },
  { id: '3', name: 'Scheduled (Đã lên lịch hẹn trước)', label: 'STOP CLOCK', days: 0, description: 'Tính thời hạn theo mốc giờ hẹn đã thỏa thuận với khách hàng.' },
  { id: '4', name: 'Auto-Close Resolution (Tự động đóng ticket)', label: 'AUTO CLOSE', days: 3, description: 'Tự động chuyển Completed thành Closed sau 3 ngày nếu khách không phản hồi.' },
];

let inMemoryAuditLogs: AuditLogItem[] = [
  {
    id: 'LOG-00025',
    type: 'TENANT_PROVISION',
    description: 'Cấp phát B2B Tenant mới qua gRPC: StartUp Hub Inc',
    before: 'null',
    after: '{ db: "tenant_startuphub", plan: "GROWTH" }',
    actor: 'admin@multiservice.io',
    timestamp: '2026-02-28 14:22:00',
    time: '5 phút trước',
  },
  {
    id: 'LOG-00024',
    type: 'FINANCE_RISK_FUND',
    description: 'Cập nhật tỷ lệ trích quỹ rủi ro từ 5.0% lên 5.5%',
    before: '5.0%',
    after: '5.5%',
    actor: 'admin@multiservice.io',
    timestamp: '2026-02-28 12:10:00',
    time: '2 giờ trước',
  },
  {
    id: 'LOG-00023',
    type: 'PRICE_UPDATE',
    description: 'Điều chỉnh ma trận K-Rule: Giờ cao điểm cuối tuần x1.3',
    before: 'multiplier: 1.20',
    after: 'multiplier: 1.30',
    actor: 'sale.manager@multiservice.io',
    timestamp: '2026-02-27 18:30:00',
    time: 'Hôm qua',
  },
  {
    id: 'LOG-00022',
    type: 'ROLE_GRANT',
    description: 'Cấp quyền SCOPE_FINANCE_READ cho Quản trị viên chi nhánh',
    before: 'ROLE_TECH_LEAD',
    after: 'ROLE_FINANCE_ADMIN',
    actor: 'admin@multiservice.io',
    timestamp: '2026-02-26 09:15:00',
    time: '2 ngày trước',
  },
  {
    id: 'LOG-00021',
    type: 'RMA_SERIAL_SWAP',
    description: 'Ghi nhận tráo Serial mới RMA Switch Juniper từ FPT Synnex',
    before: 'SN-JUN-8812',
    after: 'SN-JUN-9934',
    actor: 'warehouse@multiservice.io',
    timestamp: '2026-02-25 15:45:00',
    time: '3 ngày trước',
  },
];

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();

    // 1. Fetch Techs from AdminListUsers
    let technicians: TechnicianLocation[] = [];
    try {
      const usersRes = await protoAdminListUsers({ pageSize: 50 });
      if (usersRes.success && usersRes.response) {
        const rawUsers = usersRes.response.users || [];
        const techUsers = rawUsers.filter((u: any) => {
          const role = String(u.role || '').toLowerCase();
          return role.includes('tech') || role.includes('field') || role.includes('3');
        });

        // Coordinates around HCMC central districts
        const baseCoords = [
          { lat: 10.7769, lng: 106.7009, area: 'Quận 1 - Bến Nghé' },
          { lat: 10.7825, lng: 106.6995, area: 'Quận 3 - Võ Thị Sáu' },
          { lat: 10.7723, lng: 106.7112, area: 'Bình Thạnh - Landmark 81' },
          { lat: 10.7324, lng: 106.7198, area: 'Quận 7 - Phú Mỹ Hưng' },
          { lat: 10.7981, lng: 106.6631, area: 'Tân Bình - Sân bay TSN' },
        ];

        technicians = techUsers.slice(0, 5).map((u: any, idx: number) => {
          const coord = baseCoords[idx % baseCoords.length];
          const statuses: Array<'available' | 'critical' | 'on_site' | 'busy'> = ['available', 'on_site', 'busy', 'critical', 'available'];
          const status = statuses[idx % statuses.length];
          const color = status === 'critical' ? 'red' : status === 'available' ? 'green' : 'blue';

          return {
            id: `T${idx + 1}`,
            name: u.fullName || `KTV ${idx + 1}`,
            phone: u.phone || '0901234567',
            lat: coord.lat + (Math.random() - 0.5) * 0.005,
            lng: coord.lng + (Math.random() - 0.5) * 0.005,
            status,
            color,
            currentTicket: status !== 'available' ? `#T-${9920 + idx}` : undefined,
            assignedArea: coord.area,
          };
        });
      }
    } catch (e) {
      console.warn('[System Settings API] Could not load tech users, using defaults:', e);
    }

    if (technicians.length === 0) {
      technicians = [
        { id: 'T1', name: 'Nguyễn Văn Minh (KTV Phần cứng)', lat: 10.7769, lng: 106.7009, status: 'available', color: 'green', assignedArea: 'Quận 1 - Bến Nghé' },
        { id: 'T2', name: 'Trần Hoàng Long (KTV Mạng)', lat: 10.7825, lng: 106.6995, status: 'critical', color: 'red', currentTicket: '#T-9925', assignedArea: 'Quận 3 - Võ Thị Sáu' },
        { id: 'T3', name: 'Lê Quốc Bảo (KTV Hệ thống)', lat: 10.7723, lng: 106.7112, status: 'on_site', color: 'blue', currentTicket: '#T-9926', assignedArea: 'Bình Thạnh' },
      ];
    }

    // 2. Fetch Pending Dispatch Tickets
    let pendingDispatch: PendingDispatchTicket[] = [];
    try {
      const ticketRes = await protoListTickets({ pageSize: 30 });
      if (ticketRes.success && ticketRes.response) {
        const rawTickets = (ticketRes.response as any).tickets || [];
        pendingDispatch = rawTickets
          .filter((t: any) => !t.assigneeId && !t.assignee_id)
          .slice(0, 5)
          .map((t: any, idx: number) => {
            const priorityNum = Number(t.priority || 0);
            const priority: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL' =
              priorityNum >= 4 ? 'CRITICAL' : priorityNum === 3 ? 'HIGH' : priorityNum === 1 ? 'LOW' : 'NORMAL';

            const priorityColor =
              priority === 'CRITICAL' ? 'bg-red-100 text-red-700' :
              priority === 'HIGH' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700';

            return {
              id: t.id || `pending-${idx}`,
              ticketCode: t.ticketCode || `#T-${9925 + idx}`,
              location: 'Khu vực Trung tâm TP.HCM',
              title: t.title || 'Sự cố cần KTV xử lý gấp',
              priority,
              priorityColor,
              timeAgo: `${15 + idx * 10} phút trước`,
            };
          });
      }
    } catch (e) {
      console.warn('[System Settings API] Could not load pending tickets:', e);
    }

    if (pendingDispatch.length === 0) {
      pendingDispatch = [
        { id: '1', ticketCode: '#T-9925', location: 'Server Room - Tòa nhà Bitexco, Q.1', title: 'Máy chủ tắt nguồn đột ngột (Nghi nguồn hỏng)', priority: 'CRITICAL', priorityColor: 'bg-red-100 text-red-700', timeAgo: '12 phút trước' },
        { id: '2', ticketCode: '#T-9926', location: 'Văn phòng Công ty Logistics, Q.3', title: 'Switch mạng phân vùng tầng 4 mất kết nối toàn bộ', priority: 'HIGH', priorityColor: 'bg-orange-100 text-orange-700', timeAgo: '28 phút trước' },
        { id: '3', ticketCode: '#T-9927', location: 'Kho Tổng Hàng Hóa, Tân Bình', title: 'Máy in hóa đơn vạch mã không nhận tín hiệu LAN', priority: 'NORMAL', priorityColor: 'bg-blue-100 text-blue-700', timeAgo: '45 phút trước' },
      ];
    }

    const latency = Math.max(15, Date.now() - startTime);

    return NextResponse.json({
      technicians,
      pendingDispatch,
      maintenanceMode: isMaintenanceMode,
      slaRules: slaStopClockRules,
      auditLogs: inMemoryAuditLogs,
      notificationChannels: [
        { id: '1', name: 'Twilio (SMS Gateway)', type: 'sms', usage: '3,850', quota: '5,000 SMS', status: 'Connected', statusColor: 'bg-green-100 text-green-700' },
        { id: '2', name: 'SendGrid (Hệ thống Email)', type: 'email', usage: '12,400', quota: '25,000 Emails', status: 'Connected', statusColor: 'bg-green-100 text-green-700' },
        { id: '3', name: 'Firebase Cloud Messaging (App Push)', type: 'push', usage: '~1,200', quota: 'Không giới hạn', status: 'Connected', statusColor: 'bg-green-100 text-green-700' },
      ],
      infraHealth: [
        { id: '1', name: 'API Gateway (Next.js & Connect)', status: 'Operational', statusColor: 'text-green-600', latency: `${latency}ms` },
        { id: '2', name: 'PostgreSQL DB (Cluster & RLS)', status: 'Operational', statusColor: 'text-green-600', latency: `${Math.round(latency * 0.4)}ms` },
        { id: '3', name: 'Redis Cache & Session Store', status: 'Operational', statusColor: 'text-green-600', latency: '3ms' },
        { id: '4', name: 'Temporal Workflow Engine (SLA & RMA)', status: 'Processing', statusColor: 'text-yellow-600', latency: '65ms' },
      ],
    });
  } catch (error) {
    console.error('[System Settings API] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'TOGGLE_MAINTENANCE') {
      isMaintenanceMode = Boolean(body.enabled);
      inMemoryAuditLogs.unshift({
        id: `LOG-${Date.now()}`,
        type: 'SYSTEM_MAINTENANCE',
        description: isMaintenanceMode ? 'Kích hoạt Chế độ Bảo trì Hệ thống (Maintenance Mode)' : 'Hủy bỏ Chế độ Bảo trì Hệ thống',
        before: String(!isMaintenanceMode),
        after: String(isMaintenanceMode),
        actor: 'admin@multiservice.io',
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        time: 'Vừa xong',
      });
      return NextResponse.json({ success: true, maintenanceMode: isMaintenanceMode });
    }

    if (action === 'UPDATE_SLA_RULES') {
      const { rules } = body;
      if (Array.isArray(rules)) {
        slaStopClockRules = rules;
        inMemoryAuditLogs.unshift({
          id: `LOG-${Date.now()}`,
          type: 'SLA_POLICY_UPDATE',
          description: 'Cập nhật chính sách Stop-the-Clock & Auto-Close cho hệ thống SLA',
          before: 'Default Config',
          after: JSON.stringify(rules.map((r: any) => `${r.name}: ${r.days}d`)),
          actor: 'admin@multiservice.io',
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
          time: 'Vừa xong',
        });
        return NextResponse.json({ success: true, rules: slaStopClockRules });
      }
      return NextResponse.json({ error: 'Dữ liệu quy tắc không hợp lệ' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (error) {
    console.error('[System Settings API] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
