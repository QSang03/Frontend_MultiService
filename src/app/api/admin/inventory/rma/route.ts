import { NextRequest, NextResponse } from 'next/server';
import {
  protoCreateRma,
  protoUpdateRmaStatus,
  protoSwapRmaSerial,
  protoListRmas,
  protoGetRma,
  type CreateRmaPayload,
} from '@/lib/proto/inventory-client';

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

function mapRmaToDto(raw: unknown) {
  if (!raw) return null;
  const r = raw as Record<string, unknown>;
  return {
    id: String(r.id || ''),
    rmaNumber: String(r.rmaNumber || ''),
    itemId: String(r.itemId || ''),
    vendorName: String(r.vendorName || ''),
    originalSerialNumber: String(r.originalSerialNumber || ''),
    replacedSerialNumber: r.replacedSerialNumber ? String(r.replacedSerialNumber) : undefined,
    status: String(r.status || ''),
    defectDescription: String(r.defectDescription || ''),
    vendorRefNumber: r.vendorRefNumber ? String(r.vendorRefNumber) : undefined,
    shippingCostCents: safeBigIntToNumber(r.shippingCostCents as bigint),
    unitCostCents: safeBigIntToNumber(r.unitCostCents as bigint),
    ticketId: r.ticketId ? String(r.ticketId) : undefined,
    sentAt: timestampToIso(r.sentAt),
    receivedAt: timestampToIso(r.receivedAt),
    completedAt: timestampToIso(r.completedAt),
    notes: r.notes ? String(r.notes) : undefined,
    isOverdue: Boolean(r.isOverdue),
    daysAtVendor: Number(r.daysAtVendor || 0),
    createdAt: timestampToIso(r.createdAt),
    updatedAt: timestampToIso(r.updatedAt),
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rmaId = searchParams.get('id');

    if (rmaId) {
      const result = await protoGetRma(rmaId);
      if (!result.success || !result.response) {
        return NextResponse.json({ error: result.error || 'RMA not found' }, { status: 404 });
      }
      const resp = result.response as Record<string, unknown>;
      return NextResponse.json({ rma: mapRmaToDto(resp.rma) });
    }

    const status = searchParams.get('status') || undefined;
    const itemId = searchParams.get('itemId') || undefined;
    const vendorName = searchParams.get('vendorName') || undefined;
    const onlyOverdue = searchParams.get('onlyOverdue') === 'true';
    const pageSize = searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')!, 10) : 50;

    const result = await protoListRmas({
      status,
      itemId,
      vendorName,
      onlyOverdue,
      pageSize,
    });

    if (!result.success || !result.response) {
      return NextResponse.json({ error: result.error || 'Failed to list RMAs' }, { status: 500 });
    }

    const resp = result.response as Record<string, unknown>;
    const rawRmas = (resp.rmas as unknown[]) || [];
    const rmas = rawRmas.map(mapRmaToDto);

    return NextResponse.json({
      rmas,
      nextPageToken: resp.nextPageToken || '',
      totalCount: rmas.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.itemId || !body.vendorName || !body.originalSerialNumber || !body.defectDescription) {
      return NextResponse.json(
        { error: 'itemId, vendorName, originalSerialNumber, and defectDescription are required' },
        { status: 400 }
      );
    }

    const payload: CreateRmaPayload = {
      itemId: body.itemId,
      vendorName: body.vendorName,
      originalSerialNumber: body.originalSerialNumber,
      defectDescription: body.defectDescription,
      vendorRefNumber: body.vendorRefNumber,
      shippingCostCents: body.shippingCostCents ? BigInt(body.shippingCostCents) : undefined,
      ticketId: body.ticketId,
    };

    const result = await protoCreateRma(payload);
    if (!result.success || !result.response) {
      return NextResponse.json({ error: result.error || 'Failed to create RMA' }, { status: 500 });
    }

    const resp = result.response as Record<string, unknown>;
    return NextResponse.json({
      success: true,
      rma: mapRmaToDto(resp.rma),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.rmaId) {
      return NextResponse.json({ error: 'rmaId is required' }, { status: 400 });
    }

    // Check if swap serial
    if (body.replacedSerialNumber) {
      const result = await protoSwapRmaSerial({
        rmaId: body.rmaId,
        replacedSerialNumber: body.replacedSerialNumber,
        notes: body.notes,
      });

      if (!result.success || !result.response) {
        return NextResponse.json({ error: result.error || 'Failed to swap serial' }, { status: 500 });
      }

      const resp = result.response as Record<string, unknown>;
      return NextResponse.json({
        success: true,
        rma: mapRmaToDto(resp.rma),
      });
    }

    // Status update
    if (!body.status) {
      return NextResponse.json({ error: 'status is required' }, { status: 400 });
    }

    const result = await protoUpdateRmaStatus({
      rmaId: body.rmaId,
      status: body.status,
      vendorRefNumber: body.vendorRefNumber,
      notes: body.notes,
    });

    if (!result.success || !result.response) {
      return NextResponse.json({ error: result.error || 'Failed to update RMA status' }, { status: 500 });
    }

    const resp = result.response as Record<string, unknown>;
    return NextResponse.json({
      success: true,
      rma: mapRmaToDto(resp.rma),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
