import { NextRequest, NextResponse } from 'next/server';
import { listCostCenters, createCostCenter, updateCostCenter } from '@/lib/proto/tenant-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId') || 'org-b2b-default';
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const items = await listCostCenters(orgId, activeOnly);
    return NextResponse.json({ success: true, data: items });
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
    if (!body.code || !body.name) {
      return NextResponse.json(
        { success: false, error: 'Thiếu mã hoặc tên Cost Center' },
        { status: 400 }
      );
    }
    const created = await createCostCenter({
      orgId,
      code: body.code,
      name: body.name,
      allocatedBudget: Number(body.allocatedBudget) || 0,
    });
    return NextResponse.json({ success: true, data: created });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const orgId = body.orgId || 'org-b2b-default';
    if (!body.id) {
      return NextResponse.json({ success: false, error: 'Thiếu ID' }, { status: 400 });
    }
    const updated = await updateCostCenter(orgId, body.id, {
      name: body.name,
      allocatedBudget: body.allocatedBudget !== undefined ? Number(body.allocatedBudget) : undefined,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
