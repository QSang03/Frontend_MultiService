import { NextRequest, NextResponse } from 'next/server';
import { protoListTemplates } from '@/lib/proto/contract-client';
import { serializeBigInt } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const params = {
      category: searchParams.get('category') || undefined,
      activeOnly: searchParams.get('activeOnly') !== 'false',
    };

    const result = await protoListTemplates(params);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to list templates' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        templates: serializeBigInt(result.response?.templates || []),
      },
    });
  } catch (error) {
    console.error('List templates API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
