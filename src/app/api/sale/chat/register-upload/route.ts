import { NextResponse } from 'next/server';
import { protoRegisterUpload } from '@/lib/proto/storage-client';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const fileId = String(body.file_id ?? '').trim();
  const filename = String(body.filename ?? '').trim();
  const mimeType = String(body.mime_type ?? '').trim();
  const size = Number(body.size ?? 0);
  const organizationId = body.organization_id ? String(body.organization_id).trim() : undefined;

  if (!fileId) {
    return NextResponse.json({ error: 'file_id is required' }, { status: 400 });
  }
  if (!filename) {
    return NextResponse.json({ error: 'filename is required' }, { status: 400 });
  }
  if (!mimeType) {
    return NextResponse.json({ error: 'mime_type is required' }, { status: 400 });
  }
  if (!Number.isFinite(size) || size <= 0) {
    return NextResponse.json({ error: 'Invalid file size' }, { status: 400 });
  }

  const result = await protoRegisterUpload({
    fileId,
    filename,
    mimeType,
    size,
    organizationId,
  });

  if (!result.success || !result.response) {
    return NextResponse.json({ error: result.error || 'Failed to register upload' }, { status: 500 });
  }

  const responseObj = result.response as Record<string, unknown>;
  const success = Boolean(responseObj.success ?? false);

  if (!success) {
    return NextResponse.json({ error: 'RegisterUpload returned success=false' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
