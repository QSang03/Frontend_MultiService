import { NextResponse } from 'next/server';
import { protoGetDownloadUrl, protoGetUploadUrl, protoRegisterUpload } from '@/lib/proto/storage-client';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const fileValue = formData.get('file');
  if (!(fileValue instanceof File)) {
    return NextResponse.json({ error: 'file is required' }, { status: 400 });
  }

  const organizationIdRaw = formData.get('organization_id');
  const organizationId = String(organizationIdRaw ?? '').trim() || undefined;

  const filename = String(formData.get('filename') ?? '').trim() || fileValue.name || 'attachment';
  const mimeType = String(formData.get('mime_type') ?? '').trim() || fileValue.type || 'application/octet-stream';
  const size = Number(formData.get('size') ?? fileValue.size ?? 0);

  if (!Number.isFinite(size) || size <= 0) {
    return NextResponse.json({ error: 'Invalid file size' }, { status: 400 });
  }

  const uploadUrlResult = await protoGetUploadUrl({
    filename,
    mimeType,
    size,
    organizationId,
  });

  if (!uploadUrlResult.success || !uploadUrlResult.response) {
    return NextResponse.json({ error: uploadUrlResult.error || 'Failed to get upload url' }, { status: 500 });
  }

  const uploadObj = uploadUrlResult.response as Record<string, unknown>;
  const uploadUrl = String(uploadObj.uploadUrl ?? uploadObj.upload_url ?? '').trim();
  const fileId = String(uploadObj.fileId ?? uploadObj.file_id ?? '').trim();

  if (!uploadUrl || !fileId) {
    return NextResponse.json({ error: 'Storage service returned invalid upload response' }, { status: 500 });
  }

  const fileBuffer = await fileValue.arrayBuffer();
  const putResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': mimeType },
    body: new Uint8Array(fileBuffer),
  }).catch(() => null);

  if (!putResponse || !putResponse.ok) {
    return NextResponse.json({ error: 'Failed to upload file to storage' }, { status: 502 });
  }

  const registerResult = await protoRegisterUpload({
    fileId,
    filename,
    mimeType,
    size,
    organizationId,
  });

  if (!registerResult.success || !registerResult.response) {
    return NextResponse.json({ error: registerResult.error || 'Failed to register upload' }, { status: 500 });
  }

  const registerObj = registerResult.response as Record<string, unknown>;
  const success = Boolean(registerObj.success ?? false);
  if (!success) {
    return NextResponse.json({ error: 'RegisterUpload returned success=false' }, { status: 500 });
  }

  let downloadUrl = '';
  const downloadUrlResult = await protoGetDownloadUrl({ fileId });
  if (downloadUrlResult.success && downloadUrlResult.response) {
    const downloadObj = downloadUrlResult.response as Record<string, unknown>;
    downloadUrl = String(downloadObj.downloadUrl ?? downloadObj.download_url ?? '').trim();
  }

  return NextResponse.json({
    file_metadata: {
      id: fileId,
      filename,
      mime_type: mimeType,
      size,
      url: downloadUrl,
    },
    file_id: fileId,
    filename,
    mime_type: mimeType,
    size,
    download_url: downloadUrl,
  });
}
