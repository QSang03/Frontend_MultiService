import { NextRequest, NextResponse } from 'next/server';
import {
  protoListKbArticles,
  protoCreateKbArticle,
  protoLikeKbArticle,
  CATEGORY_MAP_TO_PROTO,
  CATEGORY_PROTO_TO_STR,
} from '@/lib/proto/knowledge-base-client';

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  rootCause?: string;
  deviceRecommendations?: string[];
  firmwareNote?: string;
  category: 'PRINTERS' | 'NETWORK' | 'SOFTWARE' | 'OS' | 'HARDWARE';
  author: string;
  readTime: string;
  views: number;
  likes: number;
  date: string;
  tags?: string[];
  isVerified?: boolean;
}

// In-memory fallback cache for development or when gRPC service is not deployed yet
const inMemoryArticles: Article[] = [];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').toLowerCase().trim();
  const categoryStr = (searchParams.get('category') || 'ALL').toUpperCase();
  const categoryNum = categoryStr !== 'ALL' ? CATEGORY_MAP_TO_PROTO[categoryStr] : undefined;

  try {
    const protoRes = await protoListKbArticles({
      pageSize: 50,
      searchTerm: q || undefined,
      category: categoryNum,
    });

    if (protoRes.success && protoRes.response) {
      const resp = protoRes.response as Record<string, unknown>;
      const rawArticles = (resp.articles as unknown[]) || [];
      const mapped: Article[] = rawArticles.map((raw) => {
        const item = raw as Record<string, unknown>;
        const catNum = Number(item.category || 0);
        return {
          id: String(item.id || ''),
          title: String(item.title || ''),
          excerpt: String(item.excerpt || ''),
          content: String(item.content || ''),
          category: CATEGORY_PROTO_TO_STR[catNum] || 'PRINTERS',
          author: String(item.authorName || 'Kỹ thuật viên IT'),
          readTime: String(item.readTime || '3 phút'),
          views: Number(item.views || 0),
          likes: Number(item.likes || 0),
          date: item.createdAt ? new Date(String(item.createdAt)).toLocaleDateString('vi-VN') : 'Mới cập nhật',
          tags: Array.isArray(item.deviceTags) ? (item.deviceTags as string[]).map(String) : [],
          isVerified: Boolean(item.isVerified),
        };
      });

      return NextResponse.json({
        success: true,
        data: {
          articles: mapped,
          totalCount: Number(resp.totalCount || mapped.length),
        },
      });
    }
  } catch (err) {
    console.warn('[KnowledgeBase API] protoListKbArticles error, falling back to local store:', err);
  }

  // Fallback to local memory store if proto is not responding
  let filtered = [...inMemoryArticles];
  if (categoryStr !== 'ALL') {
    filtered = filtered.filter((a) => a.category === categoryStr);
  }
  if (q) {
    filtered = filtered.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q) ||
        a.tags?.some((t) => t.toLowerCase().includes(q))
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      articles: filtered,
      totalCount: filtered.length,
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.title || !body.content || !body.category) {
      return NextResponse.json(
        { error: 'Tiêu đề, nội dung và danh mục là bắt buộc.' },
        { status: 400 }
      );
    }

    const categoryEnum = CATEGORY_MAP_TO_PROTO[body.category] || 1;
    const deviceTags = Array.isArray(body.tags) ? body.tags : [];

    try {
      const protoRes = await protoCreateKbArticle({
        title: String(body.title).trim(),
        content: String(body.content).trim(),
        category: categoryEnum,
        deviceTags,
      });

      if (protoRes.success && protoRes.response) {
        const resp = protoRes.response as Record<string, unknown>;
        const created = resp.article as Record<string, unknown> | undefined;
        if (created) {
          const item: Article = {
            id: String(created.id || Date.now()),
            title: String(created.title || body.title),
            excerpt: String(created.excerpt || body.excerpt || body.title).slice(0, 160),
            content: String(created.content || body.content),
            rootCause: body.rootCause ? String(body.rootCause) : undefined,
            deviceRecommendations: Array.isArray(body.deviceRecommendations) ? body.deviceRecommendations : [],
            firmwareNote: body.firmwareNote ? String(body.firmwareNote) : undefined,
            category: body.category,
            author: String(created.authorName || body.author || 'Kỹ thuật viên IT'),
            readTime: String(created.readTime || '3 phút'),
            views: Number(created.views || 1),
            likes: Number(created.likes || 0),
            date: created.createdAt ? new Date(String(created.createdAt)).toLocaleDateString('vi-VN') : 'Vừa tạo',
            tags: deviceTags,
            isVerified: Boolean(created.isVerified),
          };
          inMemoryArticles.unshift(item);
          return NextResponse.json({ success: true, data: item }, { status: 201 });
        }
      }
    } catch (protoErr) {
      console.warn('[KnowledgeBase API] protoCreateKbArticle error, saving locally:', protoErr);
    }

    const newArticle: Article = {
      id: String(Date.now()),
      title: String(body.title).trim(),
      excerpt: String(body.excerpt || body.title).slice(0, 160),
      content: String(body.content).trim(),
      rootCause: body.rootCause ? String(body.rootCause) : undefined,
      deviceRecommendations: Array.isArray(body.deviceRecommendations) ? body.deviceRecommendations : [],
      firmwareNote: body.firmwareNote ? String(body.firmwareNote) : undefined,
      category: body.category,
      author: String(body.author || 'Kỹ thuật viên IT'),
      readTime: '3 phút',
      views: 1,
      likes: 0,
      date: 'Vừa tạo',
      tags: deviceTags,
      isVerified: false,
    };

    inMemoryArticles.unshift(newArticle);

    return NextResponse.json({
      success: true,
      data: newArticle,
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Lỗi xử lý';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'Mã bài viết là bắt buộc' }, { status: 400 });
    }

    try {
      const protoRes = await protoLikeKbArticle(id);
      if (protoRes.success && protoRes.response) {
        const resp = protoRes.response as Record<string, unknown>;
        return NextResponse.json({ success: true, likes: Number(resp.newLikeCount || 1) });
      }
    } catch (protoErr) {
      console.warn('[KnowledgeBase API] protoLikeKbArticle error, liking locally:', protoErr);
    }

    const article = inMemoryArticles.find((a) => a.id === id);
    if (article) {
      article.likes += 1;
      return NextResponse.json({ success: true, likes: article.likes });
    }

    return NextResponse.json({ success: true, likes: 1 });
  } catch {
    return NextResponse.json({ error: 'Lỗi cập nhật' }, { status: 500 });
  }
}
