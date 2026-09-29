import { NextRequest, NextResponse } from 'next/server';
import {
  protoListAssets,
  protoGetAsset,
  protoGetAssetTCO,
  protoGetAssetRepairHistory,
  protoGenerateAssetQR,
  protoRecordDigitalHandover,
} from '@/lib/proto/asset-client';

function safeBigIntToNumber(val?: bigint | number | string): number {
  if (val == null) return 0;
  if (typeof val === 'bigint') return Number(val);
  if (typeof val === 'number') return val;
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? 0 : parsed;
}

function timestampToIso(ts?: unknown): string | undefined {
  if (!ts) return undefined;
  const t = ts as Record<string, unknown>;
  const secondsField = t['seconds'];
  const secondsRaw =
    secondsField == null
      ? undefined
      : typeof secondsField === 'number' || typeof secondsField === 'string'
      ? secondsField
      : String(secondsField);
  if (secondsRaw == null) return undefined;
  const seconds = Number(secondsRaw);
  if (Number.isNaN(seconds)) return undefined;
  const nanos = Number((t.nanos as number | undefined) ?? 0);
  const ms = seconds * 1000 + Math.floor(nanos / 1e6);
  try {
    return new Date(ms).toISOString();
  } catch {
    return undefined;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assetId = searchParams.get('assetId');
    const qrOnly = searchParams.get('qr') === 'true';

    if (assetId && qrOnly) {
      const qrRes = await protoGenerateAssetQR(assetId);
      if (!qrRes.success || !qrRes.response) {
        return NextResponse.json({ error: qrRes.error || 'Failed to generate QR' }, { status: 500 });
      }
      return NextResponse.json(qrRes.response);
    }

    if (assetId) {
      // Fetch Asset detail, TCO, and Repair History concurrently
      const [assetRes, tcoRes, historyRes] = await Promise.all([
        protoGetAsset(assetId),
        protoGetAssetTCO({ assetId }),
        protoGetAssetRepairHistory({ assetId, pageSize: 50 }),
      ]);

      if (!assetRes.success || !assetRes.response) {
        return NextResponse.json({ error: assetRes.error || 'Asset not found' }, { status: 404 });
      }

      const asset = assetRes.response as Record<string, unknown>;
      const tco = (tcoRes.response as Record<string, unknown>) || {};
      const history = (historyRes.response as Record<string, unknown>) || {};
      const rawRecords = (history.records as unknown[]) || [];

      const records = rawRecords.map((r: unknown) => {
        const item = r as Record<string, unknown>;
        return {
          id: String(item.id || ''),
          assetId: String(item.assetId || ''),
          ticketId: String(item.ticketId || ''),
          technicianId: String(item.technicianId || ''),
          description: String(item.description || ''),
          repairCostCents: safeBigIntToNumber(item.repairCostCents as bigint),
          partsCostCents: safeBigIntToNumber(item.partsCostCents as bigint),
          componentCategory: String(item.componentCategory || 'general'),
          repairedAt: timestampToIso(item.repairedAt),
        };
      });

      return NextResponse.json({
        asset: {
          id: String(asset.id || ''),
          name: String(asset.name || ''),
          description: String(asset.description || ''),
          serialNumber: String(asset.serialNumber || ''),
          model: String(asset.model || ''),
          manufacturer: String(asset.manufacturer || ''),
          location: String(asset.location || ''),
          status: String(asset.status || 'active'),
          warrantyExpiry: timestampToIso(asset.warrantyExpiry),
          createdAt: timestampToIso(asset.createdAt),
          updatedAt: timestampToIso(asset.updatedAt),
        },
        tco: {
          totalCostCents: safeBigIntToNumber(tco.totalCostCents as bigint),
          repairCount: Number(tco.repairCount || 0),
          costByCategory: (tco.costByCategory as Record<string, number>) || {},
          lastRepairedAt: timestampToIso(tco.lastRepairedAt),
        },
        repairHistory: records,
      });
    }

    const orgId = searchParams.get('orgId') || '00000000-0000-0000-0000-000000000000';
    const search = searchParams.get('search') || '';
    const pageSize = searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')!, 10) : 50;

    const listRes = await protoListAssets({
      orgId,
      pageSize,
      search,
    });

    if (!listRes.success || !listRes.response) {
      return NextResponse.json({ error: listRes.error || 'Failed to list assets' }, { status: 500 });
    }

    const resp = listRes.response as Record<string, unknown>;
    const rawAssets = (resp.assets as unknown[]) || [];
    const assets = rawAssets.map((a: unknown) => {
      const item = a as Record<string, unknown>;
      return {
        id: String(item.id || ''),
        name: String(item.name || ''),
        description: String(item.description || ''),
        serialNumber: String(item.serialNumber || ''),
        model: String(item.model || ''),
        manufacturer: String(item.manufacturer || ''),
        location: String(item.location || ''),
        status: String(item.status || 'active'),
        warrantyExpiry: timestampToIso(item.warrantyExpiry),
        createdAt: timestampToIso(item.createdAt),
      };
    });

    return NextResponse.json({
      assets,
      totalCount: Number(resp.totalCount || assets.length),
      nextPageToken: String(resp.nextPageToken || ''),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'GENERATE_QR') {
      const { assetId } = body;
      if (!assetId) {
        return NextResponse.json({ error: 'assetId is required' }, { status: 400 });
      }
      const qrRes = await protoGenerateAssetQR(assetId);
      if (!qrRes.success || !qrRes.response) {
        return NextResponse.json({ error: qrRes.error || 'Failed to generate QR' }, { status: 500 });
      }
      return NextResponse.json(qrRes.response);
    }

    if (action === 'RECORD_HANDOVER') {
      const { ticketId, assetId, technicianId, customerName, signatureDataUrl, notes } = body;
      const res = await protoRecordDigitalHandover({
        ticketId: ticketId || '',
        assetId: assetId || '',
        technicianId: technicianId || '',
        customerName: customerName || '',
        signatureDataUrl: signatureDataUrl || '',
        notes: notes || '',
      });
      if (!res.success) {
        return NextResponse.json({ error: res.error || 'Failed to record handover' }, { status: 500 });
      }
      return NextResponse.json({ success: true, response: res.response });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

