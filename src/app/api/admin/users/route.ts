import { NextResponse } from 'next/server';
import { UserRole } from '@buf/nkc_multiservice.bufbuild_es/multiservice/auth/v1/auth_pb.js';
import {
  protoAdminListUsers,
  protoAdminUpdateUserStatus,
  protoAdminUpdateUser,
  protoAdminDeleteUser,
  protoAdminCreateUser,
} from '@/lib/proto/admin-client';

type AdminUserDto = {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role?: number | string;
  roleLabel?: string;
  isActive?: boolean;
  lastActive?: string;
  departmentId?: string;
  organizationId?: string;
};

function isSessionExpired(error?: string) {
  return typeof error === 'string' && error.toUpperCase() === 'SESSION_EXPIRED';
}

function roleLabel(role?: number | string) {
  if (typeof role === 'number') {
    return (UserRole as Record<number, string>)[role] ?? 'UNKNOWN';
  }
  if (typeof role === 'string') return role;
  return 'UNKNOWN';
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

function decodeUnknownStringField(obj: unknown, fieldNo = 13): string | undefined {
  try {
    const o = obj as Record<string, unknown>;
    const unknown = o?.$unknown as unknown;
    if (!Array.isArray(unknown)) return undefined;
    for (const entry of unknown as Array<Record<string, unknown>>) {
      if (!entry || entry.no !== fieldNo) continue;
      const data = entry.data as unknown;
      if (!data) continue;
      // data may be a Uint8Array or an object with numeric keys
      const dataLike = data as { length?: number; slice?: unknown };
      if (typeof dataLike.length === 'number' && dataLike.length > 0 && typeof dataLike.slice === 'function') {
        try {
          return new TextDecoder().decode(data as Uint8Array);
        } catch {
          // fallthrough
        }
      }
      // object with numeric keys {0: 36, 1: 48, ...}
      const keys = Object.keys(data as object).map(k => Number(k)).filter(n => !Number.isNaN(n)).sort((a, b) => a - b);
      if (keys.length === 0) continue;
      const bytes = new Uint8Array(keys.map(k => Number((data as Record<string, unknown>)[String(k)])));
      try {
        return new TextDecoder().decode(bytes);
      } catch {
        continue;
      }
    }
  } catch {
    // ignore
  }
  return undefined;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const pageSize = Number(searchParams.get('page_size') || '50');
  const pageToken = searchParams.get('page_token') || '';
  const roleFilter = searchParams.get('role_filter');

  const result = await protoAdminListUsers({
    pageSize,
    pageToken,
    roleFilter: roleFilter ? Number(roleFilter) : undefined,
  });

  if (!result.success || !result.response) {
    if (isSessionExpired(result.error)) {
      return NextResponse.json({ error: 'SESSION_EXPIRED' }, { status: 401 });
    }
    return NextResponse.json({ error: result.error || 'Failed to list users' }, { status: 500 });
  }

  const resp = result.response as Record<string, unknown>;
  const users: AdminUserDto[] = Array.isArray(resp.users)
    ? (resp.users as unknown[]).map((u) => {
        const uu = u as Record<string, unknown>;
    return {
      id: String(uu.id ?? ''),
      fullName: String(uu.fullName ?? uu.email ?? '-'),
      email: String(uu.email ?? ''),
      phone: uu.phone == null ? undefined : String(uu.phone),
      role: uu.role as number | string | undefined,
      roleLabel: roleLabel(uu.role as number | string | undefined),
      isActive: (() => {
        if (typeof uu.isActive === 'boolean') return uu.isActive as boolean;
        if (typeof uu.is_active === 'boolean') return uu.is_active as boolean;
        if (typeof uu.status === 'string') {
          const s = (uu.status as string).toLowerCase();
          return !(s === 'inactive' || s === 'disabled' || s === 'deleted');
        }
        return true;
      })(),
      lastActive: timestampToIso(uu.lastLoginAt ?? uu.last_login_at),
      departmentId: (uu.departmentId as string | undefined) ?? (uu.department_id as string | undefined) ?? decodeUnknownStringField(u),
      organizationId: uu.organizationId as string | undefined,
    } as AdminUserDto;
      })
    : [];

  return NextResponse.json({
    users,
    nextPageToken: String(resp.nextPageToken ?? ''),
  });
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const userId = body.user_id || body.userId;

  if (!userId) {
    return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
  }

  if (typeof body.is_active === 'boolean' || typeof body.isActive === 'boolean') {
    const result = await protoAdminUpdateUserStatus({
      userId,
      isActive: body.is_active ?? body.isActive,
    });

    if (!result.success) {
      if (isSessionExpired(result.error)) {
        return NextResponse.json({ error: 'SESSION_EXPIRED' }, { status: 401 });
      }
      return NextResponse.json({ error: result.error || 'Failed to update user status' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  // Handle full user updates (name/role/password/phone)
  const wantsUpdate =
    typeof body.full_name === 'string' ||
    typeof body.fullName === 'string' ||
    typeof body.role === 'number' ||
    typeof body.password === 'string' ||
    typeof body.phone === 'string' ||
    typeof body.department_id === 'string' ||
    typeof body.departmentId === 'string' ||
    typeof body.organization_id === 'string' ||
    typeof body.organizationId === 'string';

  if (wantsUpdate) {
    const result = await protoAdminUpdateUser({
      userId,
      fullName: body.full_name ?? body.fullName,
      role: typeof body.role === 'number' ? body.role : undefined,
      password: body.password,
      phone: body.phone,
      departmentId: body.department_id ?? body.departmentId ?? body.organization_id ?? body.organizationId,
    });

    if (!result.success || !result.response) {
      if (isSessionExpired(result.error)) {
        return NextResponse.json({ error: 'SESSION_EXPIRED' }, { status: 401 });
      }
      return NextResponse.json({ error: result.error || 'Failed to update user' }, { status: 500 });
    }

    const resp = result.response as Record<string, unknown>;
    const protoUser = resp.user as Record<string, unknown> | undefined;
    if (protoUser) {
      const uu = protoUser;
      const userDto: AdminUserDto = {
        id: String(uu.id ?? ''),
        fullName: String(uu.fullName ?? uu.email ?? '-'),
        email: String(uu.email ?? ''),
        phone: uu.phone == null ? undefined : String(uu.phone),
        role: uu.role as number | string | undefined,
        roleLabel: roleLabel(uu.role as number | string | undefined),
        isActive: (() => {
          if (typeof uu.isActive === 'boolean') return uu.isActive as boolean;
          if (typeof uu.is_active === 'boolean') return uu.is_active as boolean;
          if (typeof uu.status === 'string') {
            const s = (uu.status as string).toLowerCase();
            return !(s === 'inactive' || s === 'disabled' || s === 'deleted');
          }
          return true;
        })(),
        lastActive: timestampToIso(uu.lastLoginAt ?? uu.last_login_at),
        departmentId: (uu.departmentId as string | undefined) ?? (uu.department_id as string | undefined) ?? decodeUnknownStringField(protoUser),
        organizationId: uu.organizationId as string | undefined,
      };

      return NextResponse.json({ success: true, user: userDto });
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json(
    { error: 'Update user is not supported by the current AdminService schema' },
    { status: 501 }
  );
}

export async function POST(req: Request) {
  const body = await req.json();
  const email = body.email;
  if (!email) return NextResponse.json({ error: 'email is required' }, { status: 400 });

  const result = await protoAdminCreateUser({
    email: body.email,
    phone: body.phone,
    fullName: body.full_name ?? body.fullName,
    password: body.password,
    role: body.role,
    organizationId: body.organization_id ?? body.organizationId,
  });

  if (!result.success || !result.response) {
    if (isSessionExpired(result.error)) {
      return NextResponse.json({ error: 'SESSION_EXPIRED' }, { status: 401 });
    }
    return NextResponse.json({ error: result.error || 'Failed to create user' }, { status: 500 });
  }

  // Normalize proto user to plain DTO to avoid protobuf runtime objects (BigInt etc.)
  const resp = result.response as Record<string, unknown>;
  const protoUser = resp.user as Record<string, unknown> | undefined;
  if (protoUser) {
    const uu = protoUser;
    const userDto: AdminUserDto = {
      id: String(uu.id ?? ''),
      fullName: String(uu.fullName ?? uu.email ?? '-'),
      email: String(uu.email ?? ''),
      phone: uu.phone == null ? undefined : String(uu.phone),
      role: uu.role as number | string | undefined,
      roleLabel: roleLabel(uu.role as number | string | undefined),
      isActive: (() => {
        if (typeof uu.isActive === 'boolean') return uu.isActive as boolean;
        if (typeof uu.is_active === 'boolean') return uu.is_active as boolean;
        if (typeof uu.status === 'string') {
          const s = (uu.status as string).toLowerCase();
          return !(s === 'inactive' || s === 'disabled' || s === 'deleted');
        }
        return true;
      })(),
      lastActive: timestampToIso(uu.lastLoginAt ?? uu.last_login_at),
      departmentId: (uu.departmentId as string | undefined) ?? (uu.department_id as string | undefined) ?? decodeUnknownStringField(protoUser),
      organizationId: uu.organizationId as string | undefined,
    };

    return NextResponse.json({ success: true, user: userDto });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('user_id');

  if (!userId) {
    return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
  }

  const result = await protoAdminDeleteUser({ userId });

  if (!result.success) {
    if (isSessionExpired(result.error)) {
      return NextResponse.json({ error: 'SESSION_EXPIRED' }, { status: 401 });
    }
    return NextResponse.json({ error: result.error || 'Failed to delete user' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
