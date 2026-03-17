import { NextRequest, NextResponse } from 'next/server';
import { protoGetAssetTCO } from '@/lib/proto/asset-client';

export async function GET(req: NextRequest) {
  const assetId = req.nextUrl.searchParams.get('assetId');
  if (!assetId) return NextResponse.json({ error: 'assetId required' }, { status: 400 });

  const result = await protoGetAssetTCO({ assetId });
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json(result.response);
}
