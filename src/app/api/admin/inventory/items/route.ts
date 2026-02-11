import { NextRequest, NextResponse } from 'next/server';
import {
  protoCreateItem,
  protoListItems,
  protoGetItem,
  protoUpdateItem,
  type CreateItemPayload,
  type UpdateItemPayload,
  type ListItemsPayload,
  type CostingMethod,
} from '@/lib/proto/inventory-client';

// Costing method enum mapping
const COSTING_METHOD_MAP: Record<number, CostingMethod> = {
  0: 'COSTING_METHOD_UNSPECIFIED',
  1: 'FIFO',
  2: 'WEIGHTED_AVERAGE',
  3: 'SPECIFIC_ID',
};

export interface InventoryItemDto {
  id: string;
  skuCode: string;
  name: string;
  categoryId?: string;
  description?: string;
  minStockLevel: number;
  costingMethod: CostingMethod;
  metadata?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  // Computed/joined fields
  totalQuantity?: string;
  avgCost?: string;
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

function normalizeItem(s: unknown): InventoryItemDto {
  const obj = (s as Record<string, unknown>) || {};
  const id = String(obj.id ?? '');
  const skuCode = String(obj.skuCode ?? obj.sku_code ?? '');
  const name = String(obj.name ?? '');
  const categoryId = obj.categoryId ?? obj.category_id;
  const description = obj.description == null ? undefined : String(obj.description);
  const minStockLevel = Number(obj.minStockLevel ?? obj.min_stock_level ?? 0);
  const costingMethodRaw = Number(obj.costingMethod ?? obj.costing_method ?? 0);
  const costingMethod = COSTING_METHOD_MAP[costingMethodRaw] ?? 'COSTING_METHOD_UNSPECIFIED';
  const metadata = obj.metadata == null ? undefined : String(obj.metadata);
  const isActive = Boolean(obj.isActive ?? obj.is_active ?? true);
  const createdAt = timestampToIso(obj.createdAt ?? obj.created_at);
  const updatedAt = timestampToIso(obj.updatedAt ?? obj.updated_at);

  return {
    id,
    skuCode,
    name,
    categoryId: categoryId == null ? undefined : String(categoryId),
    description,
    minStockLevel,
    costingMethod,
    metadata,
    isActive,
    createdAt,
    updatedAt,
  };
}

// GET /api/admin/inventory/items - List items
// GET /api/admin/inventory/items?id=xxx - Get single item
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      // Get single item
      const result = await protoGetItem(id);

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
      const item = resp.item ? normalizeItem(resp.item) : null;

      return NextResponse.json({ item });
    }

    // List items
    const payload: ListItemsPayload = {};
    
    const categoryId = searchParams.get('categoryId');
    if (categoryId) payload.categoryId = categoryId;
    
    const isActive = searchParams.get('isActive');
    if (isActive !== null) payload.isActive = isActive === 'true';
    
    const pageSize = searchParams.get('pageSize');
    if (pageSize) payload.pageSize = parseInt(pageSize, 10);
    
    const pageToken = searchParams.get('pageToken');
    if (pageToken) payload.pageToken = pageToken;

    const result = await protoListItems(payload);

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
    const rawItems = (resp.items ?? []) as unknown[];
    const items = rawItems.map(normalizeItem);
    const nextPageToken = resp.nextPageToken ?? resp.next_page_token ?? '';

    return NextResponse.json({
      items,
      nextPageToken,
    });
  } catch (error) {
    console.error('[Inventory Items API] GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/inventory/items - Create item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const payload: CreateItemPayload = {
      skuCode: body.skuCode,
      name: body.name,
      categoryId: body.categoryId,
      description: body.description,
      minStockLevel: body.minStockLevel,
      costingMethod: body.costingMethod,
      metadata: body.metadata,
    };

    if (!payload.skuCode || !payload.name) {
      return NextResponse.json(
        { error: 'SKU code and name are required' },
        { status: 400 }
      );
    }

    const result = await protoCreateItem(payload);

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
    const item = resp.item ? normalizeItem(resp.item) : null;

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error('[Inventory Items API] POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/inventory/items - Update item
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 }
      );
    }

    const payload: UpdateItemPayload = {
      id: body.id,
    };

    if (body.name !== undefined) payload.name = body.name;
    if (body.description !== undefined) payload.description = body.description;
    if (body.minStockLevel !== undefined) payload.minStockLevel = body.minStockLevel;
    if (body.costingMethod !== undefined) payload.costingMethod = body.costingMethod;
    if (body.metadata !== undefined) payload.metadata = body.metadata;

    const result = await protoUpdateItem(payload);

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
    const item = resp.item ? normalizeItem(resp.item) : null;

    return NextResponse.json({ item });
  } catch (error) {
    console.error('[Inventory Items API] PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
