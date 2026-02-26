import { NextResponse } from 'next/server';
import {
  protoCreateCategory,
  protoGetCategory,
  protoListCategories,
  protoUpdateCategory,
} from '@/lib/proto/catalog-client';

export type ServiceCategoryDto = {
  id: string;
  name: string;
  description?: string;
  attributesSchema?: string;
  parentId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  status?: number;
};

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

function normalizeCategory(c: unknown): ServiceCategoryDto {
  const obj = (c as Record<string, unknown>) || {};
  const id = String(obj.id ?? obj.categoryId ?? obj.category_id ?? '');
  const name = String(obj.name ?? '');
  const description = obj.description == null ? undefined : String(obj.description);
  const attributesSchema = (obj.attributesSchema ?? obj.attributes_schema) as string | undefined;
  const parentId = (obj.parentId ?? obj.parent_id ?? null) as string | null | undefined;
  const createdAt = timestampToIso(obj.createdAt ?? obj.created_at);
  const updatedAt = timestampToIso(obj.updatedAt ?? obj.updated_at);
  const createdBy = obj.createdBy == null ? undefined : String(obj.createdBy);
  const statusRaw = obj.status as number | string | undefined;
  const status = statusRaw == null ? undefined : Number(statusRaw);

  return {
    id,
    name,
    description,
    attributesSchema,
    parentId,
    createdAt,
    updatedAt,
    createdBy,
    status: Number.isNaN(status) ? undefined : status,
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const pageSize = Number(searchParams.get('page_size') || '50');
  const pageToken = searchParams.get('page_token') || '';
  const parentId = searchParams.get('parent_id') || undefined;
  const hasServicesRaw = searchParams.get('has_services');
  const showApprovedRaw = searchParams.get('show_approved');
  const categoryId = searchParams.get('category_id') || undefined;
  const hasServices = hasServicesRaw == null ? undefined : hasServicesRaw === 'true';
  const showApproved = showApprovedRaw == null ? undefined : showApprovedRaw === 'true';

  if (categoryId) {
    const result = await protoGetCategory({ categoryId });
    if (!result.success || !result.response) {
      return NextResponse.json({ error: result.error || 'Failed to get category' }, { status: 500 });
    }

    const resp = result.response as Record<string, unknown>;
    const category = normalizeCategory(resp.category);
    return NextResponse.json({ category });
  }

  const result = await protoListCategories({
    pageSize,
    pageToken,
    parentId,
    hasServices,
    showApproved,
  });

  if (!result.success || !result.response) {
    return NextResponse.json({ error: result.error || 'Failed to list categories' }, { status: 500 });
  }

  const resp = result.response as Record<string, unknown>;
  const categoriesRaw = (resp.categories ?? resp.category ?? []) as unknown[];
  const categories = Array.isArray(categoriesRaw) ? categoriesRaw.map(normalizeCategory) : [];
  const nextPageToken = String(resp.nextPageToken ?? resp.next_page_token ?? '');

  return NextResponse.json({ categories, nextPageToken });
}

export async function POST(req: Request) {
  const body = await req.json();
  const name = body.name;

  if (!name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }

  const result = await protoCreateCategory({
    name,
    description: body.description,
    attributesSchema: body.attributes_schema ?? body.attributesSchema ?? '',
    parentId: body.parent_id ?? body.parentId,
  });

  if (!result.success || !result.response) {
    return NextResponse.json({ error: result.error || 'Failed to create category' }, { status: 500 });
  }

  const category = normalizeCategory((result.response as Record<string, unknown>).category);
  return NextResponse.json({ success: true, category });
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const categoryId = body.id ?? body.category_id ?? body.categoryId;

  if (!categoryId) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const result = await protoUpdateCategory({
    categoryId,
    name: body.name,
    description: body.description,
    attributesSchema: body.attributes_schema ?? body.attributesSchema,
    parentId: body.parent_id ?? body.parentId,
    status: body.status ?? body.category_status,
  });

  if (!result.success || !result.response) {
    return NextResponse.json({ error: result.error || 'Failed to update category' }, { status: 500 });
  }

  const category = normalizeCategory((result.response as Record<string, unknown>).category);
  return NextResponse.json({ success: true, category });
}