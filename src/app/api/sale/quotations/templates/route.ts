import { NextResponse } from 'next/server';
import { serializeBigInt } from '@/lib/api-utils';
import {
  protoListQuotationTemplates,
  protoCreateQuotationTemplate,
  protoUpdateQuotationTemplate,
  protoDeleteQuotationTemplate,
} from '@/lib/proto/quotation-client';

// GET - List templates
export async function GET(req: Request) {
  const url = new URL(req.url);
  const category = url.searchParams.get('category') ?? undefined;
  const isActiveParam = url.searchParams.get('is_active');
  const isActive = isActiveParam === null ? undefined : isActiveParam === 'true';

  const result = await protoListQuotationTemplates({ category, isActive });
  if (!result.success || !result.response) {
    return NextResponse.json({ error: result.error || 'ListQuotationTemplates failed' }, { status: 500 });
  }
  const resp = result.response as Record<string, unknown>;
  return NextResponse.json({ templates: serializeBigInt(resp.templates ?? []) });
}

// POST - Create template
export async function POST(req: Request) {
  const body = await req.json();
  const { name, description, items, category } = body as Record<string, string>;
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

  const result = await protoCreateQuotationTemplate({
    name,
    description: description ?? '',
    items: typeof items === 'string' ? items : JSON.stringify(items ?? []),
    category: category ?? '',
  });
  if (!result.success || !result.response) {
    return NextResponse.json({ error: result.error || 'CreateQuotationTemplate failed' }, { status: 500 });
  }
  const resp = result.response as Record<string, unknown>;
  return NextResponse.json({ template: serializeBigInt(resp.template ?? resp) }, { status: 201 });
}

// PUT - Update template
export async function PUT(req: Request) {
  const body = await req.json();
  const { id, name, description, items, category, is_active } = body as Record<string, unknown>;
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const result = await protoUpdateQuotationTemplate({
    id: String(id),
    name: name !== undefined ? String(name) : undefined,
    description: description !== undefined ? String(description) : undefined,
    items: items !== undefined ? (typeof items === 'string' ? items : JSON.stringify(items)) : undefined,
    category: category !== undefined ? String(category) : undefined,
    isActive: is_active !== undefined ? Boolean(is_active) : undefined,
  });
  if (!result.success || !result.response) {
    return NextResponse.json({ error: result.error || 'UpdateQuotationTemplate failed' }, { status: 500 });
  }
  const resp = result.response as Record<string, unknown>;
  return NextResponse.json({ template: serializeBigInt(resp.template ?? resp) });
}

// DELETE - Delete template
export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id') ?? '';
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const result = await protoDeleteQuotationTemplate(id);
  if (!result.success) {
    return NextResponse.json({ error: result.error || 'DeleteQuotationTemplate failed' }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
