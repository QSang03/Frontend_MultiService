import { NextRequest, NextResponse } from 'next/server';
import { getApprovalSettings, updateApprovalSettings } from '@/lib/proto/tenant-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId') || 'org-b2b-default';
    const settings = await getApprovalSettings(orgId);
    return NextResponse.json({ success: true, data: settings });
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
    const orgId = body.orgId || 'org-b2b-default';
    const updated = await updateApprovalSettings({
      orgId,
      enabled: Boolean(body.enabled),
      levels: Number(body.levels) || 1,
      threshold1: Number(body.threshold1) || 2000000,
      threshold2: Number(body.threshold2) || 10000000,
      timeoutHours: Number(body.timeoutHours) || 24,
      escalationHours: Number(body.escalationHours) || 48,
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
