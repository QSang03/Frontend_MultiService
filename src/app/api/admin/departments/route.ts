import { NextResponse } from 'next/server';
import {
  protoCreateDepartment,
  protoDeleteDepartment,
  protoGetDepartment,
  protoListDepartments,
  protoUpdateDepartment,
} from '@/lib/proto/department-client';

export type DepartmentDto = {
  id: string;
  name: string;
  code?: string;
  description?: string;
  parentId?: string | null;
  parentName?: string | null;
  createdAt?: string;
  updatedAt?: string;
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

function normalizeDepartment(d: unknown): DepartmentDto {
  const obj = (d as Record<string, unknown>) || {};
  const id = String(obj.id ?? obj.departmentId ?? obj.department_id ?? '');
  const name = String(obj.name ?? '');
  const code = obj.code == null ? undefined : String(obj.code);
  const description = obj.description == null ? undefined : String(obj.description);
  const parentId = obj.parentId ?? obj.parent_id ?? null;
  const parentName = obj.parentName ?? obj.parent_name ?? null;
  const createdAt = timestampToIso(obj.createdAt ?? obj.created_at);
  const updatedAt = timestampToIso(obj.updatedAt ?? obj.updated_at);

  return {
    id,
    name,
    code,
    description,
    parentId: parentId as string | null | undefined,
    parentName: parentName as string | null | undefined,
    createdAt,
    updatedAt,
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const pageSize = Number(searchParams.get('page_size') || '50');
  const pageToken = searchParams.get('page_token') || '';
  const parentId = searchParams.get('parent_id') || undefined;
  const departmentId = searchParams.get('department_id') || undefined;

  if (departmentId) {
    const result = await protoGetDepartment({ departmentId });
    if (!result.success || !result.response) {
      return NextResponse.json({ error: result.error || 'Failed to get department' }, { status: 500 });
    }

    const resp = result.response as Record<string, unknown>;
    const department = normalizeDepartment(resp.department);
    return NextResponse.json({ department });
  }

  const result = await protoListDepartments({
    pageSize,
    pageToken,
    parentId,
  });

  if (!result.success || !result.response) {
    return NextResponse.json({ error: result.error || 'Failed to list departments' }, { status: 500 });
  }

  const resp = result.response as Record<string, unknown>;
  const departments: DepartmentDto[] = Array.isArray(resp.departments)
    ? (resp.departments as unknown[]).map((x: unknown) => normalizeDepartment(x))
    : [];

  return NextResponse.json({
    departments,
    nextPageToken: String(resp.nextPageToken ?? ''),
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  const name = body.name;
  const code = body.code;

  if (!name || !code) {
    return NextResponse.json({ error: 'name and code are required' }, { status: 400 });
  }

  const result = await protoCreateDepartment({
    name,
    code,
    description: body.description,
    parentId: body.parent_id ?? body.parentId,
  });

  if (!result.success || !result.response) {
    return NextResponse.json({ error: result.error || 'Failed to create department' }, { status: 500 });
  }

  const department = normalizeDepartment((result.response as unknown as Record<string, unknown>).department);

  return NextResponse.json({ success: true, department });
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const departmentId = body.department_id ?? body.departmentId;

  if (!departmentId) {
    return NextResponse.json({ error: 'department_id is required' }, { status: 400 });
  }

  const result = await protoUpdateDepartment({
    departmentId,
    name: body.name,
    code: body.code,
    description: body.description,
    parentId: body.parent_id ?? body.parentId,
  });

  if (!result.success || !result.response) {
    return NextResponse.json({ error: result.error || 'Failed to update department' }, { status: 500 });
  }

  const department = normalizeDepartment((result.response as Record<string, unknown>).department);
  return NextResponse.json({ success: true, department });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const departmentId = searchParams.get('department_id');

  if (!departmentId) {
    return NextResponse.json({ error: 'department_id is required' }, { status: 400 });
  }

  const result = await protoDeleteDepartment({ departmentId });

  if (!result.success) {
    return NextResponse.json({ error: result.error || 'Failed to delete department' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
