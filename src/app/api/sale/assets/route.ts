import { NextResponse } from 'next/server';
import { protoListAssets } from '@/lib/proto/asset-client';

type AssetDto = {
  id: string;
  orgId: string;
  name: string;
  serialNumber?: string;
  model?: string;
  manufacturer?: string;
  location?: string;
  status?: string;
};

function normalizeAsset(raw: unknown): AssetDto {
  const obj = (raw as Record<string, unknown>) || {};
  return {
    id: String(obj.id ?? ''),
    orgId: String(obj.orgId ?? obj.org_id ?? ''),
    name: String(obj.name ?? ''),
    serialNumber: obj.serialNumber == null ? undefined : String(obj.serialNumber),
    model: obj.model == null ? undefined : String(obj.model),
    manufacturer: obj.manufacturer == null ? undefined : String(obj.manufacturer),
    location: obj.location == null ? undefined : String(obj.location),
    status: obj.status == null ? undefined : String(obj.status),
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orgId = searchParams.get('org_id') || searchParams.get('owner_id') || '';
  const pageSize = Number(searchParams.get('page_size') || '20');
  const pageToken = searchParams.get('page_token') || '';
  const search = searchParams.get('search') || '';

  if (!orgId.trim()) {
    return NextResponse.json({ error: 'org_id (or owner_id) is required' }, { status: 400 });
  }

  const result = await protoListAssets({
    orgId: orgId.trim(),
    pageSize,
    pageToken,
    search,
  });

  if (!result.success || !result.response) {
    return NextResponse.json({ error: result.error || 'Failed to list assets' }, { status: 500 });
  }

  const resp = result.response as Record<string, unknown>;
  const assetsRaw = (resp.assets ?? []) as unknown[];
  const assets = Array.isArray(assetsRaw) ? assetsRaw.map(normalizeAsset) : [];
  const totalCount = Number(resp.totalCount ?? resp.total_count ?? assets.length);
  const nextPageToken = String(resp.nextPageToken ?? resp.next_page_token ?? '');

  return NextResponse.json({ assets, totalCount, nextPageToken });
}
