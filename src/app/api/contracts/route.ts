import { NextRequest, NextResponse } from 'next/server';
import { protoListContracts } from '@/lib/proto/contract-client';
import { ContractStatus } from '@/types/contract';
import { serializeBigInt } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const params = {
      orgId: searchParams.get('orgId') || undefined,
      customerId: searchParams.get('customerId') || undefined,
      status: searchParams.get('status') 
        ? (parseInt(searchParams.get('status')!) as ContractStatus) 
        : undefined,
      pageSize: searchParams.get('pageSize') 
        ? parseInt(searchParams.get('pageSize')!) 
        : 20,
      pageToken: searchParams.get('pageToken') || undefined,
    };

    const result = await protoListContracts(params);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to list contracts' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: serializeBigInt({
        contracts: result.response?.contracts || [],
        nextPageToken: result.response?.nextPageToken || '',
        totalCount: result.response?.totalCount || 0,
      }),
    });
  } catch (error) {
    console.error('List contracts API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
