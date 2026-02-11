'use client';

import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  BookOpen, 
  Eye, 
  Flame, 
  Clock, 
  ThumbsUp, 
  X
} from 'lucide-react';

// --- Types ---
type Category = 'PRINTERS' | 'NETWORK' | 'SOFTWARE' | 'OS' | 'HARDWARE';

interface Article {
  id: string;
  title: string;
  excerpt: string;
  category: Category;
  author: string;
  readTime: string;
  views: number;
  likes: number;
  date: string;
}

// --- Mock Data ---
const ARTICLES: Article[] = [
  {
    id: '1',
    title: 'Ricoh MP 5054 - Error SC542 Reset Procedure',
    excerpt: 'Symptom: The machine displays SC542 (Fusing Temperature Warm-up Error). Solution Steps: 1. Enter Ser...',
    category: 'PRINTERS',
    author: 'Mike Ross',
    readTime: '2 min',
    views: 1240,
    likes: 45,
    date: '2 days ago'
  },
  {
    id: '2',
    title: 'Windows Server 2019 - Boot Loop Troubleshooting',
    excerpt: 'Details about fixing boot loop issues caused by recent updates. Requires safe mode access...',
    category: 'OS',
    author: 'Sarah Connor',
    readTime: '5 min',
    views: 890,
    likes: 120,
    date: '1 week ago'
  },
  {
    id: '3',
    title: 'Cabling Standard T568B Diagram & Pinout',
    excerpt: 'White-Orange, Orange, White-Green, Blue, White-Blue, Green, White-Brown, Brown....',
    category: 'NETWORK',
    author: 'Infra Team',
    readTime: '1 min',
    views: 2100,
    likes: 310,
    date: '3 months ago'
  },
  {
    id: '4',
    title: 'Outlook 365 - "Trying to connect" loop fix',
    excerpt: 'Create a new profile via Control Panel > Mail. Ensure Autodiscover DNS records are correct...',
    category: 'SOFTWARE',
    author: 'Alex Tech',
    readTime: '3 min',
    views: 540,
    likes: 22,
    date: 'Yesterday'
  },
  {
    id: '5',
    title: 'Kyocera Taskalfa - Drum Unit Replacement',
    excerpt: 'Open front cover, unlock the cyan lever. Pull out the drum unit carefully avoiding exposure to light...',
    category: 'PRINTERS',
    author: 'John Doe',
    readTime: '8 min',
    views: 320,
    likes: 15,
    date: '5 days ago'
  },
  {
    id: '6',
    title: 'VPN Client - Error 619 Resolution',
    excerpt: 'Check firewall settings on the router allowing GRE protocol. Verify authentication settings...',
    category: 'NETWORK',
    author: 'Mike Ross',
    readTime: '4 min',
    views: 1100,
    likes: 89,
    date: '2 weeks ago'
  }
];

const FILTERS = ['All', 'Printers', 'Network', 'Software', 'OS', 'Hardware'];

// --- Modal Component (declared outside render) ---
type ShareKnowledgeModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const ShareKnowledgeModal = ({ isOpen, onClose }: ShareKnowledgeModalProps) => {
  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        isOpen ? 'visible opacity-100' : 'invisible opacity-0'
      }`}
    >
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      <div 
        className={`relative bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden transition-all duration-300 delay-75 ${
          isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
        }`}
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Share Knowledge</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700">Title</label>
            <input 
              type="text" 
              placeholder="e.g., How to reset NVRAM on Model X"
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700">Category</label>
            <select className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer">
              <option>Printers</option>
              <option>Network</option>
              <option>Software</option>
              <option>OS</option>
              <option>Hardware</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700">Content / Steps</label>
            <textarea 
              rows={6}
              placeholder="1. Step one..."
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-y font-mono"
            />
            <p className="text-[10px] text-gray-400 text-right">Markdown supported</p>
          </div>
        </div>

        <div className="p-6 bg-gray-50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            Submit Article
          </button>
        </div>
      </div>
    </div>
  );
};


export default function KnowledgeBasePage() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Helper styles
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

  const filteredArticles = ARTICLES.filter(article => {
    const matchesFilter = activeFilter === 'All' || article.category.toUpperCase() === activeFilter.toUpperCase();
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          article.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });


  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Knowledge Base</h1>
            <p className="text-gray-500 mt-1">Guides, documentation, and community tips</p>
          </div>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium shadow-sm hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Contribute
          </button>
        </div>

        {/* STATS OVERVIEW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Articles */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Articles</p>
              <h2 className="text-3xl font-bold text-gray-900">6</h2>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>

          {/* Total Views */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Views</p>
              <h2 className="text-3xl font-bold text-gray-900">6.2k</h2>
            </div>
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
              <Eye className="w-5 h-5" />
            </div>
          </div>

          {/* Top Contributor */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Top Contributor</p>
              <h2 className="text-xl font-bold text-gray-900">Mike Ross</h2>
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
              placeholder="Search error codes, models, or topics..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
            />
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
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
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* ARTICLES GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredArticles.map((article) => (
            <div 
              key={article.id} 
              className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 hover:-translate-y-1 transition-all duration-300 group cursor-pointer flex flex-col h-full"
            >
              {/* Card Meta Header */}
              <div className="flex justify-between items-center mb-4">
                <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide ${getCategoryStyle(article.category)}`}>
                  {article.category}
                </span>
                <div className="flex items-center gap-1.5 text-gray-400 text-xs font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  {article.readTime}
                </div>
              </div>

              {/* Card Content */}
              <h3 className="text-base font-bold text-gray-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors">
                {article.title}
              </h3>
              <p className="text-sm text-gray-500 mb-6 line-clamp-2">
                {article.excerpt}
              </p>

              {/* Card Footer */}
              <div className="mt-auto flex items-center justify-between border-t border-gray-50 pt-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-xs font-bold">
                    {article.author.charAt(0)}
                  </div>
                  <span className="text-xs font-medium text-gray-600">{article.author}</span>
                </div>
                
                <div className="flex items-center gap-4 text-xs text-gray-400 font-medium">
                  <div className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    {article.views}
                  </div>
                  <div className="flex items-center gap-1">
                    <ThumbsUp className="w-3.5 h-3.5" />
                    {article.likes}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ShareKnowledgeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
