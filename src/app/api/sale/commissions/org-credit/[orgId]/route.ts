import { NextRequest, NextResponse } from 'next/server';
import { protoGetOrgCreditBalance } from '@/lib/proto/contract-client';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;

    if (!orgId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const result = await protoGetOrgCreditBalance(orgId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to get organization credit balance' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.response,
    });
  } catch (error) {
    console.error('Get org credit balance API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}