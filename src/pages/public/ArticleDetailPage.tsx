import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { repository } from '../../services/storageService';
import { Article } from '../../types';
import { formatDate } from '../../lib/utils';
import { ShieldCheck, ExternalLink, ArrowLeft, Calendar, User, Tag } from 'lucide-react';

export const ArticleDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);

  useEffect(() => {
    if (slug) {
      const art = repository.getArticles().find((a) => a.slug === slug);
      if (art) setArticle(art);
    }
  }, [slug]);

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-gray-500">
        Article not found.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Link
        to="/articles"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Knowledge Hub</span>
      </Link>

      <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm p-6 sm:p-10 space-y-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-100 text-emerald-900 text-xs font-bold px-3 py-1 rounded-lg">
              {article.category}
            </span>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDate(article.created_at)}</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-950 tracking-tight leading-tight">
            {article.title}
          </h1>

          <div className="flex items-center gap-2 text-xs text-gray-600">
            <User className="w-4 h-4 text-gray-400" />
            <span>Author / Compiler: <strong>{article.author}</strong></span>
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden aspect-2/1 bg-gray-100">
          <img src={article.cover_image} alt={article.title} className="w-full h-full object-cover" />
        </div>

        {/* Official Source Callout */}
        {article.official_source && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-emerald-900 font-semibold">
              <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
              <div>
                <span>Official Institutional Source: <strong>{article.official_source}</strong></span>
                <p className="text-[11px] text-emerald-700 font-normal">Directly cross-referenced against state agricultural bulletins.</p>
              </div>
            </div>
            {article.official_url && (
              <a
                href={article.official_url}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold flex items-center gap-1 self-start sm:self-auto shrink-0"
              >
                <span>Official Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        )}

        {/* Content Body */}
        <div className="prose prose-emerald max-w-none text-sm text-gray-700 leading-relaxed whitespace-pre-line">
          {article.content}
        </div>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="pt-4 border-t border-gray-100 flex items-center gap-2 flex-wrap">
            <Tag className="w-4 h-4 text-gray-400" />
            {article.tags.map((t) => (
              <span key={t} className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg text-xs font-medium">
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
