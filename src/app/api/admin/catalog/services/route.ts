import { NextResponse } from 'next/server';
import {
  protoCreateService,
  protoDeleteService,
  protoGetService,
  protoListServices,
  protoUpdateService,
} from '@/lib/proto/catalog-client';

export type ServiceDto = {
  id: string;
  categoryId?: string;
  name: string;
  description?: string;
  code?: string;
  pricingModel?: number;
  basePrice?: string;
  attributes?: string;
  slaConfig?: string;
  defaultPriority?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

const PRICING_MODEL_FROM_STRING: Record<string, number> = {
  fixed: 1,
  recurring: 2,
};

function coercePricingModel(value: unknown): number | undefined {
  if (value == null) return undefined;
  if (typeof value === 'number') return Number.isNaN(value) ? undefined : value;
  if (typeof value === 'string') {
    const trimmed = value.trim().toLowerCase();
    if (trimmed in PRICING_MODEL_FROM_STRING) return PRICING_MODEL_FROM_STRING[trimmed];
    const asNumber = Number(trimmed);
    return Number.isNaN(asNumber) ? undefined : asNumber;
  }
  return undefined;
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

function normalizeService(s: unknown): ServiceDto {
  const obj = (s as Record<string, unknown>) || {};
  const id = String(obj.id ?? obj.serviceId ?? obj.service_id ?? '');
  const name = String(obj.name ?? '');
  const description = obj.description == null ? undefined : String(obj.description);
  const categoryId = obj.categoryId ?? obj.category_id ?? undefined;
  const code = obj.code == null ? undefined : String(obj.code);
  const pricingModelRaw = obj.pricingModel ?? obj.pricing_model;
  const pricingModel = pricingModelRaw == null ? undefined : Number(pricingModelRaw);
  const basePrice = obj.basePrice ?? obj.base_price;
  const attributes = obj.attributes == null ? undefined : String(obj.attributes);
  const slaConfig = obj.slaConfig ?? obj.sla_config;
  const defaultPriority = obj.defaultPriority ?? obj.default_priority;
  const isActive = obj.isActive ?? obj.is_active;
  const createdAt = timestampToIso(obj.createdAt ?? obj.created_at);
  const updatedAt = timestampToIso(obj.updatedAt ?? obj.updated_at);

  return {
    id,
    name,
    description,
    categoryId: categoryId == null ? undefined : String(categoryId),
    code,
    pricingModel: pricingModel == null || Number.isNaN(pricingModel) ? undefined : pricingModel,
    basePrice: basePrice == null ? undefined : String(basePrice),
    attributes,
    slaConfig: slaConfig == null ? undefined : String(slaConfig),
    defaultPriority: defaultPriority == null ? undefined : String(defaultPriority),
    isActive: isActive == null ? undefined : Boolean(isActive),
    createdAt,
    updatedAt,
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const pageSize = Number(searchParams.get('page_size') || '50');
  const pageToken = searchParams.get('page_token') || '';
  const categoryId = searchParams.get('category_id') || undefined;
  const showInactive = searchParams.get('show_inactive') === 'true';
  const serviceId = searchParams.get('service_id') || undefined;

  if (serviceId) {
    const result = await protoGetService({ serviceId });
    if (!result.success || !result.response) {
      return NextResponse.json({ error: result.error || 'Failed to get service' }, { status: 500 });
    }

    const resp = result.response as Record<string, unknown>;
    const service = normalizeService(resp.service);
    return NextResponse.json({ service });
  }

  const result = await protoListServices({
    pageSize,
    pageToken,
    categoryId,
    showInactive,
  });

  if (!result.success || !result.response) {
    return NextResponse.json({ error: result.error || 'Failed to list services' }, { status: 500 });
  }

  const resp = result.response as Record<string, unknown>;
  const servicesRaw = (resp.services ?? resp.service ?? []) as unknown[];
  const services = Array.isArray(servicesRaw) ? servicesRaw.map(normalizeService) : [];
  const nextPageToken = String(resp.nextPageToken ?? resp.next_page_token ?? '');
  const totalCount = Number(resp.totalCount ?? resp.total_count ?? services.length);

  return NextResponse.json({ services, nextPageToken, totalCount });
}

export async function POST(req: Request) {
  const body = await req.json();
  console.debug('[services.route] POST body:', body);
  const categoryId = body.category_id ?? body.categoryId;
  const name = body.name;

  if (!categoryId || !name) {
    return NextResponse.json({ error: 'category_id and name are required' }, { status: 400 });
  }

  const createPayload = {
    categoryId,
    name,
    description: body.description,
    code: body.code,
    pricingModel: coercePricingModel(body.pricing_model ?? body.pricingModel),
    basePrice: body.base_price ?? body.basePrice,
    attributes: body.attributes,
    slaConfig: body.sla_config ?? body.slaConfig,
    defaultPriority: body.default_priority ?? body.defaultPriority,
  };

  console.debug('[services.route] createPayload:', createPayload);

  const result = await protoCreateService(createPayload);
  console.debug('[services.route] protoCreateService result:', result);

  if (!result.success || !result.response) {
    // Provide more detailed error to help debugging unique constraint issues
    const errMsg = result.error ?? 'Failed to create service';
    console.error('[services.route] create failed:', errMsg, result.response ?? null);
    return NextResponse.json({ error: errMsg, detail: result.response ?? null }, { status: 409 });
  }

  const service = normalizeService((result.response as Record<string, unknown>).service);
  return NextResponse.json({ success: true, service });
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const serviceId = body.id ?? body.service_id ?? body.serviceId;

  if (!serviceId) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const result = await protoUpdateService({
    serviceId,
    categoryId: body.category_id ?? body.categoryId,
    name: body.name,
    description: body.description,
    code: body.code,
    pricingModel: coercePricingModel(body.pricing_model ?? body.pricingModel),
    basePrice: body.base_price ?? body.basePrice,
    attributes: body.attributes,
    slaConfig: body.sla_config ?? body.slaConfig,
    defaultPriority: body.default_priority ?? body.defaultPriority,
  });

  if (!result.success || !result.response) {
    return NextResponse.json({ error: result.error || 'Failed to update service' }, { status: 500 });
  }

  const service = normalizeService((result.response as Record<string, unknown>).service);
  return NextResponse.json({ success: true, service });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const serviceId = searchParams.get('service_id') || undefined;

  if (!serviceId) {
    return NextResponse.json({ error: 'service_id is required' }, { status: 400 });
  }

  const result = await protoDeleteService({ serviceId });

  if (!result.success) {
    return NextResponse.json({ error: result.error || 'Failed to delete service' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}