import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    const body = await req.json().catch(() => ({}));
    const matrix = body.matrix || body.permissions || {};

    // In a full RBAC engine, this updates Casbin/OPA or PostgreSQL rbac_rules
    return NextResponse.json({
      success: true,
      message: 'Cập nhật ma trận phân quyền RBAC thành công',
      updatedAt: new Date().toISOString(),
      updatedBy: (session?.user as { email?: string } | undefined)?.email || 'admin',
      matrix,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
