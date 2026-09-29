import { NextRequest, NextResponse } from 'next/server';
import { protoGetApprovalSettings, protoUpdateApprovalSettings } from '@/lib/proto/tenant-client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    const settings = await protoGetApprovalSettings(id);
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('[Tenant Approval API] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updated = await protoUpdateApprovalSettings({
      orgId: id,
      enabled: Boolean(body.enabled),
      levels: Number(body.levels || 2),
      threshold1: Number(body.threshold1 || 2000000),
      threshold2: Number(body.threshold2 || 10000000),
      timeoutHours: Number(body.timeoutHours || 24),
      escalationHours: Number(body.escalationHours || 48),
    });

    return NextResponse.json({ settings: updated });
  } catch (error) {
    console.error('[Tenant Approval API] PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
