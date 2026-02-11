import { NextRequest, NextResponse } from 'next/server';
import { protoCreateRecurringSchedule } from '@/lib/proto/contract-client';
import type { CreateRecurringScheduleRequest } from '@/types/contract';
import { serializeBigInt } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    const body: CreateRecurringScheduleRequest = await request.json();

    // Validate required fields
    if (!body.contractId || !body.cronExpression || !body.categoryId) {
      return NextResponse.json(
        { error: 'Missing required fields: contractId, cronExpression, categoryId' },
        { status: 400 }
      );
    }

    const result = await protoCreateRecurringSchedule(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create recurring schedule' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: serializeBigInt({
        scheduleId: result.response?.scheduleId,
        temporalWorkflowId: result.response?.temporalWorkflowId,
      }),
    });
  } catch (error) {
    console.error('Create recurring schedule API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
