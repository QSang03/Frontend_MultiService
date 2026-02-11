import { NextResponse } from 'next/server';
import { protoRejectCategory } from '@/lib/proto/catalog-client';
import { normalizeCategory } from '@/lib/api-utils';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));

  const result = await protoRejectCategory({ 
    id,
    reason: body.reason ?? ''
  });

  if (!result.success || !result.response) {
    return NextResponse.json({ error: result.error || 'Failed to reject category' }, { status: 500 });
  }

  const category = normalizeCategory((result.response as Record<string, unknown>).category);
  return NextResponse.json({ success: true, category });
}
