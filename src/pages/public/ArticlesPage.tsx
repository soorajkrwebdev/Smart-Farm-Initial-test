import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { repository } from '../../services/storageService';
import { Article } from '../../types';
import { formatDate } from '../../lib/utils';
import { BookOpen, Search, ShieldCheck, ArrowRight, Tag } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

export const ArticlesPage: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    async function load() {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase
            .from('articles')
            .select('*')
            .eq('is_published', true)
            .order('created_at', { ascending: false });
          if (!error && data && data.length > 0) {
            setArticles(data as Article[]);
            return;
          }
        } catch (e) {
          console.warn('Articles fetch from Supabase failed:', e);
        }
      }
      const all = repository.getArticles().filter((a) => a.is_published);
      setArticles(all);
    }
    load();
  }, []);

  const categories = ['all', 'Disease Management', 'Government Schemes', 'Crop Cultivation', 'Organic Farming'];

  const filtered = articles.filter((a) => {
    const matchesCat = selectedCategory === 'all' || a.category === selectedCategory;
    const matchesSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.summary.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight">
            Farming Knowledge Hub & Govt Schemes
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Verified agricultural advisories, pest treatment protocols, and official Karnataka government subsidy guides.
          </p>
        </div>
      </div>

      {/* Search & Category Pills */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search articles, pests, crops, or government subsidies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-emerald-900 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {cat === 'all' ? 'All Guides' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((art) => (
          <div
            key={art.id}
            className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              <img src={art.cover_image} alt={art.title} className="w-full h-44 object-cover" />
              <div className="p-5 space-y-2.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-md border border-emerald-200">
                    {art.category}
                  </span>
                  <span className="text-gray-400">{formatDate(art.created_at)}</span>
                </div>

                <Link to={`/articles/${art.slug}`}>
                  <h3 className="font-bold text-gray-900 text-base hover:text-emerald-800 leading-snug line-clamp-2">
                    {art.title}
                  </h3>
                </Link>

                <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                  {art.summary}
                </p>

                {art.official_source && (
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 font-semibold pt-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="truncate">{art.official_source}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-5 pt-0">
              <Link
                to={`/articles/${art.slug}`}
                className="w-full py-2.5 px-4 rounded-xl border border-gray-200 hover:bg-emerald-50 text-emerald-900 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Read Verified Guide</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
