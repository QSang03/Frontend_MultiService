import { NextRequest, NextResponse } from 'next/server';
import {
  protoAdjustStock,
  protoGetStockStatus,
  type AdjustStockPayload,
  type TransactionType,
} from '@/lib/proto/inventory-client';

// Transaction type enum mapping
const TRANSACTION_TYPE_MAP: Record<number, TransactionType> = {
  0: 'TRANSACTION_TYPE_UNSPECIFIED',
  1: 'TRANSACTION_TYPE_IN',
  2: 'TRANSACTION_TYPE_OUT',
  3: 'TRANSACTION_TYPE_ADJUST',
  4: 'TRANSACTION_TYPE_RMA',
};

export interface InventoryStockDto {
  id: string;
  itemId: string;
  batchNumber?: string;
  quantity: string;
  unitCost: string;
  createdAt?: string;
}

export interface InventoryTransactionDto {
  id: string;
  itemId: string;
  type: TransactionType;
  quantity: string;
  unitCost: string;
  ticketId?: string;
  reason: string;
  batchNumber?: string;
  createdAt?: string;
  createdBy?: string;
}

export interface StockStatusDto {
  totalQuantity: string;
  currentAvgCost: string;
  batches: InventoryStockDto[];
}

function timestampToIso(ts?: unknown): string | undefined {
  if (!ts) return undefined;
  const t = ts as Record<string, unknown>;
  const secondsField = t['seconds'];
  const secondsRaw = (secondsField == null)
    ? undefined
    : (typeof secondsField === 'number' || typeof secondsField === 'string' ? secondsField : String(secondsField));
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

function normalizeBatch(s: unknown): InventoryStockDto {
  const obj = (s as Record<string, unknown>) || {};
  return {
    id: String(obj.id ?? ''),
    itemId: String(obj.itemId ?? obj.item_id ?? ''),
    batchNumber: obj.batchNumber ?? obj.batch_number ? String(obj.batchNumber ?? obj.batch_number) : undefined,
    quantity: String(obj.quantity ?? '0'),
    unitCost: String(obj.unitCost ?? obj.unit_cost ?? '0'),
    createdAt: timestampToIso(obj.createdAt ?? obj.created_at),
  };
}

function normalizeTransaction(s: unknown): InventoryTransactionDto {
  const obj = (s as Record<string, unknown>) || {};
  const typeRaw = Number(obj.type ?? 0);
  return {
    id: String(obj.id ?? ''),
    itemId: String(obj.itemId ?? obj.item_id ?? ''),
    type: TRANSACTION_TYPE_MAP[typeRaw] ?? 'TRANSACTION_TYPE_UNSPECIFIED',
    quantity: String(obj.quantity ?? '0'),
    unitCost: String(obj.unitCost ?? obj.unit_cost ?? '0'),
    ticketId: obj.ticketId ?? obj.ticket_id ? String(obj.ticketId ?? obj.ticket_id) : undefined,
    reason: String(obj.reason ?? ''),
    batchNumber: obj.batchNumber ?? obj.batch_number ? String(obj.batchNumber ?? obj.batch_number) : undefined,
    createdAt: timestampToIso(obj.createdAt ?? obj.created_at),
    createdBy: obj.createdBy ?? obj.created_by ? String(obj.createdBy ?? obj.created_by) : undefined,
  };
}

// GET /api/admin/inventory/stock?itemId=xxx - Get stock status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');

    if (!itemId) {
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 }
      );
    }

    const result = await protoGetStockStatus(itemId);

    if (!result.success) {
      if (result.error === 'SESSION_EXPIRED') {
        return NextResponse.json({ error: 'Session expired' }, { status: 401 });
      }
      if (result.error === 'PROTO_MODULE_NOT_AVAILABLE') {
        return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
      }
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const resp = result.response as Record<string, unknown>;
    const rawBatches = (resp.batches ?? []) as unknown[];

    const stockStatus: StockStatusDto = {
      totalQuantity: String(resp.totalQuantity ?? resp.total_quantity ?? '0'),
      currentAvgCost: String(resp.currentAvgCost ?? resp.current_avg_cost ?? '0'),
      batches: rawBatches.map(normalizeBatch),
    };

    return NextResponse.json(stockStatus);
  } catch (error) {
    console.error('[Inventory Stock API] GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/inventory/stock - Adjust stock (inbound, outbound, adjustment, etc.)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const payload: AdjustStockPayload = {
      itemId: body.itemId,
      type: body.type,
      quantity: String(body.quantity),
      unitCost: String(body.unitCost ?? '0'),
      reason: body.reason ?? '',
    };

    if (body.ticketId) payload.ticketId = body.ticketId;
    if (body.batchNumber) payload.batchNumber = body.batchNumber;

    if (!payload.itemId || !payload.type || !payload.quantity) {
      return NextResponse.json(
        { error: 'Item ID, type, and quantity are required' },
        { status: 400 }
      );
    }

    // Validate transaction type
    const validTypes: TransactionType[] = [
      'TRANSACTION_TYPE_IN',
      'TRANSACTION_TYPE_OUT',
      'TRANSACTION_TYPE_ADJUST',
      'TRANSACTION_TYPE_RMA',
    ];
    if (!validTypes.includes(payload.type)) {
      return NextResponse.json(
        { error: 'Invalid transaction type' },
        { status: 400 }
      );
    }

    // RMA: luôn 0 theo quy trình
    if (payload.type === 'TRANSACTION_TYPE_RMA') {
      payload.unitCost = '0';
    }

    if (payload.type === 'TRANSACTION_TYPE_IN') {
      const unitCostValue = Number(payload.unitCost);
      if (Number.isNaN(unitCostValue) || unitCostValue <= 0) {
        return NextResponse.json(
          { error: 'Invalid unit cost' },
          { status: 400 }
        );
      }
    } else if (payload.type === 'TRANSACTION_TYPE_ADJUST') {
      if (payload.unitCost && payload.unitCost !== '0') {
        const unitCostValue = Number(payload.unitCost);
        if (Number.isNaN(unitCostValue) || unitCostValue <= 0) {
          return NextResponse.json(
            { error: 'Invalid unit cost' },
            { status: 400 }
          );
        }
      }
    } else {
      // OUT: unit cost không bắt buộc, mặc định 0
      payload.unitCost = '0';
    }

    const result = await protoAdjustStock(payload);

    if (!result.success) {
      if (result.error === 'SESSION_EXPIRED') {
        return NextResponse.json({ error: 'Session expired' }, { status: 401 });
      }
      if (result.error === 'PROTO_MODULE_NOT_AVAILABLE') {
        return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
      }
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const resp = result.response as Record<string, unknown>;
    const transaction = resp.transaction ? normalizeTransaction(resp.transaction) : null;
    const newTotalQuantity = String(resp.newTotalQuantity ?? resp.new_total_quantity ?? '0');

    return NextResponse.json({
      transaction,
      newTotalQuantity,
    }, { status: 201 });
  } catch (error) {
    console.error('[Inventory Stock API] POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
