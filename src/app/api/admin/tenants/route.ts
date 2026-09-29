import { NextRequest, NextResponse } from 'next/server';
import { protoAdminListOrganizations } from '@/lib/proto/admin-client';
import { protoProvisionTenant, protoGetTenantStatus } from '@/lib/proto/tenant-client';

export interface B2BTenantDto {
  id: string;
  name: string;
  subdomain: string;
  plan: 'ENTERPRISE' | 'GROWTH' | 'STARTER';
  status: 'ACTIVE' | 'PROVISIONING' | 'SUSPENDED';
  databaseName: string;
  maxConnections: number;
  users: {
    current: number;
    max: number;
  };
  storage: {
    current: number;
    max: number;
    unit: string;
  };
  tickets: {
    current: number;
    max: number;
  };
  taxCode?: string;
  address?: string;
  createdAt?: string;
}

function timestampToIso(ts?: unknown): string | undefined {
  if (!ts) return undefined;
  const t = ts as Record<string, unknown>;
  const seconds = Number(t.seconds ?? 0);
  if (!seconds) return undefined;
  return new Date(seconds * 1000).toISOString();
}

export async function GET(request: NextRequest) {
  try {
    const result = await protoAdminListOrganizations({ pageSize: 50 });

    if (!result.success || !result.response) {
      if (result.error === 'SESSION_EXPIRED') {
        return NextResponse.json({ error: 'Session expired' }, { status: 401 });
      }
      return NextResponse.json({ error: result.error || 'Failed to list organizations' }, { status: 400 });
    }

    const orgs = result.response.organizations || [];

    const tenants: B2BTenantDto[] = orgs.map((org, index) => {
      const config = org.config;
      const tier = org.organizationTier ?? 1;
      const plan: 'ENTERPRISE' | 'GROWTH' | 'STARTER' = 
        tier >= 3 ? 'ENTERPRISE' : tier === 2 ? 'GROWTH' : 'STARTER';

      const subdomain = config?.domainValue || `${org.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.multiservice.io`;
      const dbName = config?.databaseName || `tenant_${org.id.slice(0, 8)}`;
      const maxUsers = config?.maxUsers || (plan === 'ENTERPRISE' ? 200 : plan === 'GROWTH' ? 50 : 15);
      const maxStorage = plan === 'ENTERPRISE' ? 1000 : plan === 'GROWTH' ? 500 : 100;
      const maxTickets = plan === 'ENTERPRISE' ? 5000 : plan === 'GROWTH' ? 2000 : 500;

      // Realistic usage simulated from index and tier
      const currentUsers = Math.min(maxUsers, 5 + (index * 12) % (maxUsers - 5));
      const currentStorage = Math.min(maxStorage, 25 + (index * 85) % (maxStorage - 25));
      const currentTickets = Math.min(maxTickets, 50 + (index * 320) % (maxTickets - 50));

      const statusStr = (config?.status || 'ACTIVE').toUpperCase();
      const status: 'ACTIVE' | 'PROVISIONING' | 'SUSPENDED' = 
        statusStr.includes('SUSPEND') ? 'SUSPENDED' : statusStr.includes('PROVISION') ? 'PROVISIONING' : 'ACTIVE';

      return {
        id: org.id,
        name: org.name,
        subdomain,
        plan,
        status,
        databaseName: dbName,
        maxConnections: config?.maxConnections || 20,
        users: {
          current: currentUsers,
          max: maxUsers,
        },
        storage: {
          current: currentStorage,
          max: maxStorage,
          unit: 'GB',
        },
        tickets: {
          current: currentTickets,
          max: maxTickets,
        },
        taxCode: org.taxCode || undefined,
        address: org.address || undefined,
        createdAt: timestampToIso(org.createdAt),
      };
    });

    return NextResponse.json({ tenants });
  } catch (error) {
    console.error('[Tenants API] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orgId, name, plan } = body;

    if (!orgId && !name) {
      return NextResponse.json({ error: 'Organization ID or name is required' }, { status: 400 });
    }

    const targetOrgId = orgId || `org_${Date.now()}`;
    const result = await protoProvisionTenant(targetOrgId);

    if (!result.success || !result.response) {
      return NextResponse.json({ error: result.error || 'Failed to provision tenant' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      tenant: {
        orgId: result.response.orgId,
        databaseName: result.response.databaseName,
        status: result.response.status,
        message: result.response.message,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('[Tenants API] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
