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

    if (result.success && result.response) {
      const templates = result.response.templates || [];
      return NextResponse.json({
        success: true,
        data: {
          templates: serializeBigInt(templates),
        },
      });
    }

    // Return empty list if backend failed
    console.warn('protoListTemplates failed:', result.error);
    return NextResponse.json({
      success: false,
      error: result.error || 'Failed to fetch templates',
      data: {
        templates: [],
      },
    });
  } catch (error) {
    console.error('List templates API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      data: {
        templates: [],
      },
    }, { status: 500 });
  }
}

