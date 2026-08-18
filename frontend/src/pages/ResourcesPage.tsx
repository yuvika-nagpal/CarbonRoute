import React, { useState, useEffect } from 'react';
import {
  FolderDown,
  FileText,
  Download,
  Filter,
  Layers,
  Calendar,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api';
import { Resource } from '../types';

export const ResourcesPage: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [category, setCategory] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchResources = async (cat: string) => {
    setLoading(true);
    try {
      const res = await api.getResources(cat);
      if (res.success && res.data) {
        setResources(res.data);
      }
    } catch (err) {
      console.error('Failed to load resources:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources(category);
  }, [category]);

  const categories = [
    { id: 'all', name: 'All Documents' },
    { id: 'presentation', name: 'Presentations' },
    { id: 'report', name: 'Project Reports' },
    { id: 'dataset', name: 'Trace Specs & Data' },
    { id: 'diagram', name: 'Architecture Diagrams' },
    { id: 'documentation', name: 'Technical Docs' },
  ];

  const handleDownload = (res: Resource) => {
    const link = document.createElement('a');
    link.href = `${res.fileUrl}?download=true`;
    link.setAttribute('download', res.fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-3 pb-6 border-b border-slate-800">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
          <FolderDown className="w-3.5 h-3.5" />
          <span>Document &amp; Resource Repository</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-mono">
          Project Deliverables &amp; Research Library
        </h1>
        <p className="text-sm text-slate-400 max-w-3xl leading-relaxed">
          Access verified whitepapers, system architecture specifications, dataset schemas, and baseline algorithm definitions stored in object storage.
        </p>
      </div>

      {/* Category Filter Bar */}
      <div className="glass-card rounded-xl p-4 border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 text-slate-300">
          <Filter className="w-4 h-4 text-emerald-400" />
          <span className="font-mono font-semibold">Filter by Category:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 font-mono">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                category === c.id
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Resource Cards Grid */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 font-mono text-xs flex flex-col items-center justify-center space-y-3 glass-card rounded-2xl border border-slate-800">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
          <span>Loading repository documents...</span>
        </div>
      ) : resources.length === 0 ? (
        <div className="p-12 text-center text-slate-400 font-mono text-xs glass-card rounded-2xl border border-slate-800">
          No documents found in this category.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((res) => (
            <div
              key={res.id}
              className="glass-card glass-card-hover rounded-xl p-5 border border-slate-800/80 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    {res.category}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {Math.round(res.fileSize / 1024)} KB
                  </span>
                </div>

                <h3 className="font-bold text-white text-sm tracking-tight leading-snug">
                  {res.title}
                </h3>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {res.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/70 flex items-center justify-between text-xs">
                <span className="text-[10px] font-mono text-slate-500">
                  {new Date(res.createdAt).toLocaleDateString()}
                </span>

                <button
                  onClick={() => handleDownload(res)}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-slate-200 hover:text-emerald-300 font-mono text-xs flex items-center space-x-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
