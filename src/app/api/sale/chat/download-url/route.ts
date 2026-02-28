import { NextResponse } from 'next/server';
import { protoGetDownloadUrl } from '@/lib/proto/storage-client';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const fileId = String(searchParams.get('file_id') ?? '').trim();

  if (!fileId) {
    return NextResponse.json({ error: 'file_id is required' }, { status: 400 });
  }

  const result = await protoGetDownloadUrl({ fileId });
  if (!result.success || !result.response) {
    return NextResponse.json({ error: result.error || 'Failed to get download url' }, { status: 500 });
  }

  const responseObj = result.response as Record<string, unknown>;
  const downloadUrl = String(responseObj.downloadUrl ?? responseObj.download_url ?? '').trim();

  return NextResponse.json({ download_url: downloadUrl });
}
