import { NextResponse } from 'next/server';
import { protoGetUploadUrl } from '@/lib/proto/storage-client';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const filename = String(body.filename ?? '').trim();
  const mimeType = String(body.mime_type ?? '').trim();
  const size = Number(body.size ?? 0);
  const organizationId = body.organization_id ? String(body.organization_id).trim() : undefined;

  if (!filename) {
    return NextResponse.json({ error: 'filename is required' }, { status: 400 });
  }
  if (!mimeType) {
    return NextResponse.json({ error: 'mime_type is required' }, { status: 400 });
  }
  if (!Number.isFinite(size) || size <= 0) {
    return NextResponse.json({ error: 'Invalid file size' }, { status: 400 });
  }

  const result = await protoGetUploadUrl({
    filename,
    mimeType,
    size,
    organizationId,
  });

  if (!result.success || !result.response) {
    return NextResponse.json({ error: result.error || 'Failed to get upload url' }, { status: 500 });
  }

  const responseObj = result.response as Record<string, unknown>;
  const uploadUrl = String(responseObj.uploadUrl ?? responseObj.upload_url ?? '').trim();
  const fileId = String(responseObj.fileId ?? responseObj.file_id ?? '').trim();

  if (!uploadUrl || !fileId) {
    return NextResponse.json({ error: 'Storage service returned invalid upload response' }, { status: 500 });
  }

  return NextResponse.json({ upload_url: uploadUrl, file_id: fileId });
}
