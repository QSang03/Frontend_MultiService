import { NextRequest, NextResponse } from 'next/server';
import { protoRecordDigitalHandover } from '@/lib/proto/asset-client';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { ticketId, assetId, technicianId, customerName, signatureDataUrl, notes } = body;

  if (!ticketId || !signatureDataUrl) {
    return NextResponse.json({ error: 'ticketId and signatureDataUrl required' }, { status: 400 });
  }

  const result = await protoRecordDigitalHandover({
    ticketId,
    assetId: assetId ?? '',
    technicianId: technicianId ?? '',
    customerName: customerName ?? '',
    signatureDataUrl,
    notes: notes ?? '',
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ success: true, handoverId: (result.response as Record<string, unknown>)?.handoverId });
}
