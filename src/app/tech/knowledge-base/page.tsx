'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Plus, 
  BookOpen, 
  Eye, 
  Flame, 
  Clock, 
  ThumbsUp, 
  X, 
  ChevronRight, 
  Tag, 
  User, 
  AlertCircle, 
  CheckCircle, 
  ArrowLeft, 
  Send, 
  Cpu, 
  Wifi, 
  Monitor, 
  HardDrive, 
  Printer,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/components/ui';

// --- Types ---
type Category = 'PRINTERS' | 'NETWORK' | 'SOFTWARE' | 'OS' | 'HARDWARE';

interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  rootCause?: string;
  deviceRecommendations?: string[];
  firmwareNote?: string;
  category: Category;
  author: string;
  readTime: string;
  views: number;
  likes: number;
  date: string;
  tags?: string[];
  isVerified?: boolean;
}

const FILTERS = ['All', 'Printers', 'Network', 'Software', 'OS', 'Hardware'];

const CATEGORY_ICON: Record<Category, React.FC<{className?: string}>> = {
  PRINTERS: ({className}) => <Printer className={className} />,
  NETWORK: ({className}) => <Wifi className={className} />,
  SOFTWARE: ({className}) => <Monitor className={className} />,
  OS: ({className}) => <Cpu className={className} />,
  HARDWARE: ({className}) => <HardDrive className={className} />,
};

// ============================================================
// ArticleDetailModal
// ============================================================
interface ArticleDetailModalProps {
  article: Article | null;
  onClose: () => void;
  onLike: (id: string) => void;
}

const ArticleDetailModal = ({ article, onClose, onLike }: ArticleDetailModalProps) => {
  if (!article) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded bg-blue-100 text-blue-700 uppercase tracking-wide">
              {article.category}
            </span>
            {article.isVerified && (
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                <CheckCircle className="w-3.5 h-3.5" /> Đã kiểm duyệt
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-200/50 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight mb-3">
              {article.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 pb-4 border-b border-gray-100">
              <span className="flex items-center gap-1.5 font-medium text-gray-700">
                <User className="w-3.5 h-3.5 text-gray-400" /> {article.author}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {article.readTime}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" /> {article.views} lượt xem
              </span>
              <span>{article.date}</span>
            </div>
          </div>

          {/* Root cause callout */}
          {article.rootCause && (
            <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-1">Nguyên nhân cốt lõi (Root Cause)</h4>
                <p className="text-sm text-amber-800 leading-relaxed">{article.rootCause}</p>
              </div>
            </div>
          )}

          {/* Markdown Content */}
          <div className="prose prose-slate max-w-none text-sm leading-relaxed space-y-4">
            {article.content.split('\n\n').map((block, idx) => {
              if (block.startsWith('## ')) {
                return <h2 key={idx} className="text-base font-bold text-gray-900 mt-6 mb-2">{block.replace('## ', '')}</h2>;
              }
              if (block.startsWith('### ')) {
                return <h3 key={idx} className="text-sm font-bold text-gray-800 mt-4 mb-1">{block.replace('### ', '')}</h3>;
              }
              if (block.startsWith('```')) {
                const codeLines = block.replace(/```[a-z]*\n?/g, '').trim();
                return (
                  <pre key={idx} className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs overflow-x-auto font-mono">
                    <code>{codeLines}</code>
                  </pre>
                );
              }
              return <p key={idx} className="text-gray-700 whitespace-pre-line">{block}</p>;
            })}
          </div>

          {/* Recommendations */}
          {article.deviceRecommendations && article.deviceRecommendations.length > 0 && (
            <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4">
              <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2">Thiết bị áp dụng</h4>
              <div className="flex flex-wrap gap-2">
                {article.deviceRecommendations.map((d, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 bg-white border border-blue-200 rounded-lg text-blue-800 font-medium">
                    {d}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {article.tags.map(t => (
                <span key={t} className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md font-medium">
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <button
            onClick={() => onLike(article.id)}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-blue-50 hover:text-blue-600 text-gray-700 border border-gray-200 rounded-xl text-sm font-medium transition-colors shadow-sm"
          >
            <ThumbsUp className="w-4 h-4" />
            Hữu ích ({article.likes})
          </button>
          <div className="flex items-center gap-2 text-gray-400 text-xs">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span>Xác thực bởi Kỹ thuật viên hệ thống</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// ShareKnowledgeModal
// ============================================================
interface ShareKnowledgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newArticle: Article) => void;
}

const ShareKnowledgeModal = ({ isOpen, onClose, onSuccess }: ShareKnowledgeModalProps) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('PRINTERS');
  const [content, setContent] = useState('');
  const [rootCause, setRootCause] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      addToast('error', 'Vui lòng nhập tiêu đề và nội dung hướng dẫn');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/tech/knowledge-base', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          category,
          content: content.trim(),
          rootCause: rootCause.trim() || undefined,
          tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
        }),
      });

      if (!res.ok) {
        throw new Error('Gửi bài viết thất bại');
      }

      const json = await res.json();
      if (json.data) {
        addToast('success', 'Đã thêm giải pháp thành công vào Knowledge Base');
        onSuccess(json.data);
        onClose();
        setTitle('');
        setContent('');
        setRootCause('');
        setTagsInput('');
      }
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Lỗi khi gửi bài viết');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Đóng góp kinh nghiệm &amp; Giải pháp kỹ thuật</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700">Tiêu đề hướng dẫn / Mã lỗi *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: HP LaserJet M404dn - Khắc phục lỗi kẹt giấy Error 13.00.00"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700">Danh mục thiết bị *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="PRINTERS">Máy in &amp; Photocopy (PRINTERS)</option>
              <option value="NETWORK">Mạng, Router &amp; Switch (NETWORK)</option>
              <option value="HARDWARE">Phần cứng máy tính, Server (HARDWARE)</option>
              <option value="OS">Hệ điều hành Windows, Linux (OS)</option>
              <option value="SOFTWARE">Phần mềm văn phòng &amp; Ứng dụng (SOFTWARE)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700">Nguyên nhân cốt lõi (Root Cause)</label>
            <input
              type="text"
              value={rootCause}
              onChange={(e) => setRootCause(e.target.value)}
              placeholder="VD: Rơ-le tách giấy bị dính hoặc bám bụi mực..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700">Các bước xử lý chi tiết *</label>
            <textarea
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Mô tả cụ thể từng bước thao tác:&#10;1. Tắt nguồn và rút cáp điện...&#10;2. Tháo nắp bên hông...&#10;3. Dùng cồn vệ sinh trục cuốn..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs leading-relaxed"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700">Từ khóa tìm kiếm (Tags, cách nhau bằng dấu phẩy)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="VD: HP, Kẹt giấy, Pickup Roller, M404"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="p-6 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
          <button onClick={onClose} disabled={isSubmitting} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100">
            Hủy
          </button>
          <button onClick={handleSubmit} disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Lưu bài viết
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Main Page
// ============================================================
export default function KnowledgeBasePage() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch articles from real API
  const loadArticles = useCallback(async () => {
    setLoading(true);
    try {
      const categoryParam = activeFilter === 'All' ? 'ALL' : activeFilter.toUpperCase();
      const res = await fetch(`/api/tech/knowledge-base?category=${encodeURIComponent(categoryParam)}&q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data?.articles) {
          setArticles(json.data.articles);
        }
      }
    } catch (err) {
      console.error('[knowledge-base] Error fetching articles:', err);
    } finally {
      setLoading(false);
    }
  }, [activeFilter, searchQuery]);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  const handleLike = async (id: string) => {
    // Optimistic UI update
    setArticles(prev => prev.map(a => a.id === id ? { ...a, likes: a.likes + 1 } : a));
    setSelectedArticle(prev => prev && prev.id === id ? { ...prev, likes: prev.likes + 1 } : prev);

    try {
      await fetch('/api/tech/knowledge-base', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
    } catch {
      // ignore error
    }
  };

  const getCategoryStyle = (category: Category) => {
    switch (category) {
      case 'PRINTERS': return 'bg-orange-50 text-orange-600';
      case 'NETWORK': return 'bg-blue-50 text-blue-600';
      case 'SOFTWARE': return 'bg-slate-100 text-slate-600';
      case 'OS': return 'bg-purple-50 text-purple-600';
      case 'HARDWARE': return 'bg-emerald-50 text-emerald-600';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  const getCategoryIconStyle = (category: Category) => {
    switch (category) {
      case 'PRINTERS': return 'bg-orange-50 text-orange-500';
      case 'NETWORK': return 'bg-blue-50 text-blue-500';
      case 'SOFTWARE': return 'bg-slate-100 text-slate-500';
      case 'OS': return 'bg-purple-50 text-purple-500';
      case 'HARDWARE': return 'bg-emerald-50 text-emerald-500';
      default: return 'bg-gray-50 text-gray-500';
    }
  };

  const totalViews = articles.reduce((sum, a) => sum + a.views, 0);
  const topContributor = articles.length === 0 ? '—' : Object.entries(
    articles.reduce((acc, a) => ({ ...acc, [a.author]: (acc[a.author] || 0) + 1 }), {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cẩm Nang Kỹ Thuật (Knowledge Base)</h1>
            <p className="text-gray-500 mt-1">Kho hướng dẫn xử lý sự cố, mã lỗi và quy trình chuẩn từ kỹ thuật viên</p>
          </div>
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold shadow-sm hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Đóng góp bài viết
          </button>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Tổng bài hướng dẫn</p>
              <h2 className="text-3xl font-bold text-gray-900">{articles.length}</h2>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Lượt tham khảo</p>
              <h2 className="text-3xl font-bold text-gray-900">{totalViews.toLocaleString()}</h2>
            </div>
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
              <Eye className="w-5 h-5" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Đóng góp tích cực</p>
              <h2 className="text-lg font-bold text-gray-900">{topContributor}</h2>
            </div>
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
              <Flame className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Tìm mã lỗi (SC542, Error 619), tên thiết bị hoặc từ khóa..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
            {FILTERS.map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  activeFilter === filter
                    ? 'bg-gray-900 text-white shadow-md'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {filter === 'All' ? 'Tất cả' : filter}
              </button>
            ))}
          </div>
        </div>

        {/* ARTICLES GRID */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
            <p className="text-sm">Đang tải cẩm nang kỹ thuật...</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-white rounded-2xl border border-gray-100">
            <BookOpen className="w-12 h-12 mb-3 text-gray-300" />
            <p className="font-semibold text-gray-700">Không tìm thấy bài viết phù hợp</p>
            <p className="text-xs text-gray-400 mt-1">Thử từ khóa khác hoặc đóng góp bài viết mới.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {articles.map(article => {
              const CategoryIcon = CATEGORY_ICON[article.category] || CATEGORY_ICON.HARDWARE;
              return (
                <div
                  key={article.id}
                  onClick={() => setSelectedArticle(article)}
                  className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 hover:-translate-y-1 transition-all duration-300 group cursor-pointer flex flex-col h-full"
                >
                  <div className="flex justify-between items-center mb-4">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide ${getCategoryStyle(article.category)}`}>
                      {article.category}
                    </span>
                    <div className="flex items-center gap-2">
                      {article.isVerified && (
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      )}
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${getCategoryIconStyle(article.category)}`}>
                        <CategoryIcon className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-gray-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">{article.excerpt}</p>

                  {article.tags && article.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {article.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full font-medium">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-auto flex items-center justify-between border-t border-gray-50 pt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                        {article.author.charAt(0)}
                      </div>
                      <span className="text-xs font-medium text-gray-600">{article.author}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-400 font-medium">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {article.readTime}
                      </div>
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="w-3.5 h-3.5" />
                        {article.likes}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-1 text-blue-500 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                    Xem chi tiết <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODALS */}
      <ArticleDetailModal
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
        onLike={handleLike}
      />
      <ShareKnowledgeModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onSuccess={(newArt) => setArticles(prev => [newArt, ...prev])}
      />
    </div>
  );
}