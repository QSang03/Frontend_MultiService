import { NextResponse } from 'next/server';
import {
  protoCreatePricingDistributionConfig,
  protoUpdatePricingDistributionConfig,
  protoUpdatePricingDistributionConfigStatus,
  protoDeletePricingDistributionConfig,
  protoListPricingDistributionConfigs,
  normalizePricingDistributionConfig,
  type PricingDistributionConfigDto,
} from '@/lib/proto/pricing-client';

// GET /api/admin/pricing/distribution-configs - List pricing distribution configs
export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get('org_id') ?? undefined;
  const isActiveParam = searchParams.get('is_active');
  const pageSize = Number(searchParams.get('page_size') ?? '50');
  const pageToken = searchParams.get('page_token') ?? '';

  const isActive = isActiveParam != null ? isActiveParam === 'true' : undefined;

  console.log('[GET /api/admin/pricing/distribution-configs] params:', { orgId, isActive, pageSize, pageToken });

  const result = await protoListPricingDistributionConfigs({
    orgId,
    isActive,
    pageSize,
    pageToken,
  });

  if (!result.success) {
    console.error('[GET /api/admin/pricing/distribution-configs] Error:', result.error);
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  const response = result.response as Record<string, unknown> | undefined;
  const configsRaw = (response?.configs as unknown[]) || [];
  const configs: PricingDistributionConfigDto[] = configsRaw.map(normalizePricingDistributionConfig);
  const nextPageToken = String(response?.nextPageToken ?? response?.next_page_token ?? '');

  console.log('[GET /api/admin/pricing/distribution-configs] Found configs:', configs.length);

  return NextResponse.json({ configs, nextPageToken });
}

// POST /api/admin/pricing/distribution-configs - Create a new pricing distribution config
export async function POST(request: Request): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const orgId = body.org_id ?? body.orgId;
  const techRate = body.tech_rate ?? body.techRate;
  const companyRate = body.company_rate ?? body.companyRate;
  const description = body.description;
  const isActive = body.is_active ?? body.isActive;

  if (!techRate || typeof techRate !== 'string') {
    return NextResponse.json({ error: 'tech_rate is required' }, { status: 400 });
  }
  if (!companyRate || typeof companyRate !== 'string') {
    return NextResponse.json({ error: 'company_rate is required' }, { status: 400 });
  }

  console.log('[POST /api/admin/pricing/distribution-configs] Creating:', { techRate, companyRate });

  const result = await protoCreatePricingDistributionConfig({
    orgId: orgId != null ? String(orgId) : undefined,
    techRate: String(techRate),
    companyRate: String(companyRate),
    description: description != null ? String(description) : undefined,
  });

  if (!result.success) {
    console.error('[POST /api/admin/pricing/distribution-configs] Error:', result.error);
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  const response = result.response as Record<string, unknown> | undefined;
  const configRaw = response?.config;
  let config = configRaw ? normalizePricingDistributionConfig(configRaw) : null;

  if (config && isActive != null && Boolean(isActive) !== config.isActive) {
    const statusResult = await protoUpdatePricingDistributionConfigStatus({
      id: config.id,
      isActive: Boolean(isActive),
    });
    if (!statusResult.success) {
      console.error('[POST /api/admin/pricing/distribution-configs] Status update error:', statusResult.error);
      return NextResponse.json({ error: statusResult.error }, { status: 500 });
    }
    const statusResponse = statusResult.response as Record<string, unknown> | undefined;
    const statusConfigRaw = statusResponse?.config;
    config = statusConfigRaw ? normalizePricingDistributionConfig(statusConfigRaw) : config;
  }

  console.log('[POST /api/admin/pricing/distribution-configs] Created:', config);

  return NextResponse.json({ config }, { status: 201 });
}

// PATCH /api/admin/pricing/distribution-configs - Update an existing pricing distribution config
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

  const techRate = body.tech_rate ?? body.techRate;
  const companyRate = body.company_rate ?? body.companyRate;
  const description = body.description;
  const isActive = body.is_active ?? body.isActive;

  const hasUpdateFields = techRate != null || companyRate != null || description != null;

  let config: PricingDistributionConfigDto | null = null;

  if (hasUpdateFields) {
    console.log('[PATCH /api/admin/pricing/distribution-configs] Updating:', { id, techRate, companyRate });

    const result = await protoUpdatePricingDistributionConfig({
      id: String(id),
      techRate: techRate != null ? String(techRate) : undefined,
      companyRate: companyRate != null ? String(companyRate) : undefined,
      description: description != null ? String(description) : undefined,
    });

    if (!result.success) {
      console.error('[PATCH /api/admin/pricing/distribution-configs] Error:', result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    const response = result.response as Record<string, unknown> | undefined;
    const configRaw = response?.config;
    config = configRaw ? normalizePricingDistributionConfig(configRaw) : null;
  }

  if (isActive != null) {
    console.log('[PATCH /api/admin/pricing/distribution-configs] Updating status:', { id, isActive });
    const statusResult = await protoUpdatePricingDistributionConfigStatus({
      id: String(id),
      isActive: Boolean(isActive),
    });

    if (!statusResult.success) {
      console.error('[PATCH /api/admin/pricing/distribution-configs] Status update error:', statusResult.error);
      return NextResponse.json({ error: statusResult.error }, { status: 500 });
    }

    const statusResponse = statusResult.response as Record<string, unknown> | undefined;
    const statusConfigRaw = statusResponse?.config;
    config = statusConfigRaw ? normalizePricingDistributionConfig(statusConfigRaw) : config;
  }

  console.log('[PATCH /api/admin/pricing/distribution-configs] Updated:', config);

  return NextResponse.json({ config });
}

// DELETE /api/admin/pricing/distribution-configs - Delete a pricing distribution config
export async function DELETE(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id is required for delete' }, { status: 400 });
  }

  console.log('[DELETE /api/admin/pricing/distribution-configs] Deleting:', id);

  const result = await protoDeletePricingDistributionConfig({ id });

  if (!result.success) {
    console.error('[DELETE /api/admin/pricing/distribution-configs] Error:', result.error);
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  const response = result.response as Record<string, unknown> | undefined;
  const success = Boolean(response?.success ?? true);

  console.log('[DELETE /api/admin/pricing/distribution-configs] Deleted:', success);

  return NextResponse.json({ success });
}
