import { NextResponse } from 'next/server';
import {
  protoCreatePricingKRule,
  protoUpdatePricingKRule,
  protoUpdatePricingKRuleStatus,
  protoDeletePricingKRule,
  protoListPricingKRules,
  normalizePricingKRule,
  RuleCategory,
  ConditionType,
  type PricingKRuleDto,
} from '@/lib/proto/pricing-client';

// GET /api/admin/pricing/k-rules - List pricing k-rules
export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get('org_id') ?? undefined;
  const ruleCategoryParam = searchParams.get('rule_category');
  const isActiveParam = searchParams.get('is_active');
  const pageSize = Number(searchParams.get('page_size') ?? '50');
  const pageToken = searchParams.get('page_token') ?? '';

  const ruleCategory = ruleCategoryParam != null ? Number(ruleCategoryParam) as RuleCategory : undefined;
  const isActive = isActiveParam != null ? isActiveParam === 'true' : undefined;

  console.log('[GET /api/admin/pricing/k-rules] params:', { orgId, ruleCategory, isActive, pageSize, pageToken });

  const result = await protoListPricingKRules({
    orgId,
    ruleCategory,
    isActive,
    pageSize,
    pageToken,
  });

  if (!result.success) {
    console.error('[GET /api/admin/pricing/k-rules] Error:', result.error);
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  const response = result.response as Record<string, unknown> | undefined;
  const rulesRaw = (response?.rules as unknown[]) || [];
  const rules: PricingKRuleDto[] = rulesRaw.map(normalizePricingKRule);
  const nextPageToken = String(response?.nextPageToken ?? response?.next_page_token ?? '');

  console.log('[GET /api/admin/pricing/k-rules] Found rules:', rules.length);

  return NextResponse.json({ rules, nextPageToken });
}

// POST /api/admin/pricing/k-rules - Create a new pricing k-rule
export async function POST(request: Request): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const orgId = body.org_id ?? body.orgId;
  const name = body.name;
  const ruleCategory = body.rule_category ?? body.ruleCategory;
  const conditionType = body.condition_type ?? body.conditionType;
  const multiplier = body.multiplier;
  const metadata = body.metadata;
  const priority = body.priority;

  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }
  if (ruleCategory == null) {
    return NextResponse.json({ error: 'rule_category is required' }, { status: 400 });
  }
  if (conditionType == null) {
    return NextResponse.json({ error: 'condition_type is required' }, { status: 400 });
  }
  if (!multiplier || typeof multiplier !== 'string') {
    return NextResponse.json({ error: 'multiplier is required' }, { status: 400 });
  }

  console.log('[POST /api/admin/pricing/k-rules] Creating:', { name, ruleCategory, conditionType, multiplier, priority });

  const result = await protoCreatePricingKRule({
    orgId: orgId != null ? String(orgId) : undefined,
    name: String(name),
    ruleCategory: Number(ruleCategory) as RuleCategory,
    conditionType: Number(conditionType) as ConditionType,
    multiplier: String(multiplier),
    metadata: metadata != null ? String(metadata) : undefined,
    priority: Number(priority ?? 0),
  });

  if (!result.success) {
    console.error('[POST /api/admin/pricing/k-rules] Error:', result.error);
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  const response = result.response as Record<string, unknown> | undefined;
  const ruleRaw = response?.rule;
  const rule = ruleRaw ? normalizePricingKRule(ruleRaw) : null;

  console.log('[POST /api/admin/pricing/k-rules] Created:', rule);

  return NextResponse.json({ rule }, { status: 201 });
}

// PATCH /api/admin/pricing/k-rules - Update an existing pricing k-rule
export async function PATCH(request: Request): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const id = body.id;
  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'id is required for update' }, { status: 400 });
  }

  const name = body.name;
  const ruleCategory = body.rule_category ?? body.ruleCategory;
  const conditionType = body.condition_type ?? body.conditionType;
  const multiplier = body.multiplier;
  const metadata = body.metadata;
  const priority = body.priority;
  const isActive = body.is_active ?? body.isActive;

  if (isActive != null) {
    console.log('[PATCH /api/admin/pricing/k-rules] Updating status:', { id, isActive });
    const result = await protoUpdatePricingKRuleStatus({
      id: String(id),
      isActive: Boolean(isActive),
    });

    if (!result.success) {
      console.error('[PATCH /api/admin/pricing/k-rules] Status update error:', result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    const response = result.response as Record<string, unknown> | undefined;
    const ruleRaw = response?.rule;
    const rule = ruleRaw ? normalizePricingKRule(ruleRaw) : null;

    console.log('[PATCH /api/admin/pricing/k-rules] Status updated:', rule);

    return NextResponse.json({ rule });
  }

  console.log('[PATCH /api/admin/pricing/k-rules] Updating:', { id, name, ruleCategory, conditionType, multiplier, priority });

  const result = await protoUpdatePricingKRule({
    id: String(id),
    name: name != null ? String(name) : undefined,
    ruleCategory: ruleCategory != null ? Number(ruleCategory) as RuleCategory : undefined,
    conditionType: conditionType != null ? Number(conditionType) as ConditionType : undefined,
    multiplier: multiplier != null ? String(multiplier) : undefined,
    metadata: metadata != null ? String(metadata) : undefined,
    priority: priority != null ? Number(priority) : undefined,
  });

  if (!result.success) {
    console.error('[PATCH /api/admin/pricing/k-rules] Error:', result.error);
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  const response = result.response as Record<string, unknown> | undefined;
  const ruleRaw = response?.rule;
  const rule = ruleRaw ? normalizePricingKRule(ruleRaw) : null;

  console.log('[PATCH /api/admin/pricing/k-rules] Updated:', rule);

  return NextResponse.json({ rule });
}

// DELETE /api/admin/pricing/k-rules - Delete a pricing k-rule
export async function DELETE(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id is required for delete' }, { status: 400 });
  }

  console.log('[DELETE /api/admin/pricing/k-rules] Deleting:', id);

  const result = await protoDeletePricingKRule({ id });

  if (!result.success) {
    console.error('[DELETE /api/admin/pricing/k-rules] Error:', result.error);
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  const response = result.response as Record<string, unknown> | undefined;
  const success = Boolean(response?.success ?? true);

  console.log('[DELETE /api/admin/pricing/k-rules] Deleted:', success);

  return NextResponse.json({ success });
}
