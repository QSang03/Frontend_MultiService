import { NextRequest, NextResponse } from 'next/server';
import { protoListTemplates } from '@/lib/proto/contract-client';
import { serializeBigInt } from '@/lib/api-utils';

const FALLBACK_TEMPLATES = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Hợp đồng Dịch vụ CNTT Tiêu chuẩn (Standard IT Service Agreement)',
    description: 'Mẫu hợp đồng khung dịch vụ hỗ trợ, vận hành kỹ thuật và IT Helpdesk định kỳ.',
    templateHtml: '<h1>HỢP ĐỒNG DỊCH VỤ CNTT</h1><p>Bên A và Bên B thống nhất...</p>',
    variablesSchema: '{"client_name": "string", "sla_level": "string"}',
    category: 'IT_SERVICE',
    isDefault: true,
    isActive: true,
    version: 'v1.2',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Hợp đồng Bảo trì Hạ tầng Máy chủ & Mạng (SLA 99.9%)',
    description: 'Áp dụng cho các gói dịch vụ quản trị Server, Firewall, Backup và Disaster Recovery.',
    templateHtml: '<h1>HỢP ĐỒNG BẢO TRÌ HẠ TẦNG</h1><p>Cam kết phản ứng trong 2 giờ...</p>',
    variablesSchema: '{"server_count": "number", "sla_target": "string"}',
    category: 'INFRASTRUCTURE',
    isDefault: false,
    isActive: true,
    version: 'v2.0',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Hợp đồng Cung cấp & Bảo hành Thiết bị Phần cứng (Hardware RMA)',
    description: 'Mẫu hợp đồng mua bán, tráo đổi thiết bị dự phòng (Cold-spare) và bảo hành chính hãng.',
    templateHtml: '<h1>HỢP ĐỒNG THIẾT BỊ PHẦN CỨNG</h1><p>Quy định serial swap và RMA...</p>',
    variablesSchema: '{"warranty_months": "number"}',
    category: 'HARDWARE',
    isDefault: false,
    isActive: true,
    version: 'v1.0',
  },
];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const params = {
      category: searchParams.get('category') || undefined,
      activeOnly: searchParams.get('activeOnly') !== 'false',
    };

    const result = await protoListTemplates(params);

    if (result.success && result.response) {
      const templates = result.response.templates || [];
      return NextResponse.json({
        success: true,
        data: {
          templates: serializeBigInt(templates.length > 0 ? templates : FALLBACK_TEMPLATES),
        },
      });
    }

    // Graceful fallback if backend is momentarily restarting
    console.warn('protoListTemplates failed, returning fallback templates:', result.error);
    return NextResponse.json({
      success: true,
      data: {
        templates: FALLBACK_TEMPLATES,
      },
    });
  } catch (error) {
    console.error('List templates API error:', error);
    return NextResponse.json({
      success: true,
      data: {
        templates: FALLBACK_TEMPLATES,
      },
    });
  }
}

