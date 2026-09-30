import { NextRequest, NextResponse } from 'next/server';
import { protoGetTenantStatus } from '@/lib/proto/tenant-client';

// In-memory fallback cache for organization profile
let cachedOrgSettings: {
  companyName: string;
  taxCode: string;
  address: string;
  logoText: string;
  logoUrl?: string;
  notifications: Array<{ key: string; label: string; checked: boolean }>;
  sla: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
} = {
  companyName: 'Tổ chức B2B',
  taxCode: '',
  address: '',
  logoText: 'B',
  logoUrl: '',
  notifications: [
    { key: 'email_approval', label: 'Email khi có yêu cầu mới cần duyệt', checked: true },
    { key: 'sms_budget', label: 'SMS khi ngân sách phòng ban vượt 80%', checked: true },
    { key: 'zalo_sla', label: 'Zalo khi có vi phạm SLA', checked: true },
    { key: 'email_maintenance', label: 'Email bảo dưỡng tài sản định kỳ', checked: true },
    { key: 'contract_renewal', label: 'Nhắc gia hạn hợp đồng (trước 30 ngày)', checked: true },
  ],
  sla: {
    critical: 2,
    high: 4,
    medium: 24,
    low: 72,
  },
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId') || 'org-b2b-default';

    try {
      const statusRes = await protoGetTenantStatus(orgId);
      if (statusRes.success && statusRes.response) {
        const resp = statusRes.response as unknown as { tenant?: { name?: string; taxCode?: string; address?: string } };
        if (resp.tenant?.name) cachedOrgSettings.companyName = resp.tenant.name;
        if (resp.tenant?.taxCode) cachedOrgSettings.taxCode = resp.tenant.taxCode;
        if (resp.tenant?.address) cachedOrgSettings.address = resp.tenant.address;
      }
    } catch {
      // Use cached/configured values
    }

    return NextResponse.json({ success: true, data: cachedOrgSettings });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    cachedOrgSettings = {
      ...cachedOrgSettings,
      companyName: body.companyName || cachedOrgSettings.companyName,
      taxCode: body.taxCode || cachedOrgSettings.taxCode,
      address: body.address || cachedOrgSettings.address,
      logoText: body.companyName ? body.companyName.charAt(0).toUpperCase() : cachedOrgSettings.logoText,
      logoUrl: body.logoUrl !== undefined ? body.logoUrl : cachedOrgSettings.logoUrl,
      notifications: Array.isArray(body.notifications) ? body.notifications : cachedOrgSettings.notifications,
      sla: body.sla ? { ...cachedOrgSettings.sla, ...body.sla } : cachedOrgSettings.sla,
    };

    return NextResponse.json({ success: true, data: cachedOrgSettings });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
