import { NextRequest, NextResponse } from 'next/server';
import { listDelegations, createDelegation, revokeDelegation } from '@/lib/proto/tenant-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId') || 'org-b2b-default';
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const delegations = await listDelegations(orgId, activeOnly);
    return NextResponse.json({ success: true, data: delegations });
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
    if (!body.managerId || !body.delegateeId || !body.startDate || !body.endDate) {
      return NextResponse.json(
        { success: false, error: 'Thiếu thông tin người ủy quyền hoặc ngày hiệu lực' },
        { status: 400 }
      );
    }
    const newDelegation = await createDelegation({
      orgId,
      managerId: body.managerId,
      delegateeId: body.delegateeId,
      startDate: body.startDate,
      endDate: body.endDate,
      requestType: body.requestType || 'ALL',
    });
    return NextResponse.json({ success: true, data: newDelegation });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId') || 'org-b2b-default';
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Thiếu delegation ID' }, { status: 400 });
    }
    const revoked = await revokeDelegation(orgId, id);
    return NextResponse.json({ success: revoked });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
