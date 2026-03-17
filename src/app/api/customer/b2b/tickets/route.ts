import { NextRequest, NextResponse } from 'next/server';
import { protoCreateTicket } from '@/lib/proto/ticket-client';
import { recordCostCenterSpent } from '@/lib/proto/tenant-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      categoryId,
      priority,
      costCenterId,
      estimatedAmount,
      attributes,
      orgId = 'org-b2b-default',
    } = body;

    if (!title || !categoryId) {
      return NextResponse.json({ success: false, error: 'Thiếu tiêu đề hoặc danh mục' }, { status: 400 });
    }

    // Call proto create ticket
    const protoRes = await protoCreateTicket({
      categoryId,
      title,
      description: description || '',
      priority: priority || 'normal',
      attributes: attributes || '{}',
      costCenterId,
    });

    // If cost center selected and estimated amount > 0, deduct from remaining budget
    if (costCenterId && estimatedAmount && Number(estimatedAmount) > 0) {
      await recordCostCenterSpent(orgId, costCenterId, Number(estimatedAmount));
    }

    return NextResponse.json({
      success: true,
      data: protoRes.response || {
        id: `ticket-${Date.now()}`,
        title,
        status: 'PENDING_APPROVAL',
        costCenterId,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
