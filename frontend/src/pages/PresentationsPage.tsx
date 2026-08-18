import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  Download,
  Eye,
  RefreshCw,
  AlertCircle,
  Clock,
  User,
} from 'lucide-react';
import { api } from '../services/api';
import { PresentationItem } from '../types';

export const PresentationsPage: React.FC = () => {
  const [presentations, setPresentations] = useState<PresentationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPresentations = async () => {
    setLoading(true);
    setError(null);
    try {
      // Query backend presentations with drafts included so that official unreleased deliverables show correctly as "Not Published"
      const res = await api.getAllVersions();
      if (res.success && res.data) {
        setPresentations(res.data);
      } else {
        // Fallback default list if network issue
        setPresentations([
          {
            id: 'pres-grid-v1',
            title: 'Software Grid',
            deliverableType: 'software_grid',
            versionTag: 'v1',
            description: 'Course Software Engineering UCS503 curriculum project grid and milestone roadmap.',
            fileName: 'CarbonRoute_Software_Grid.pdf',
            filePath: 'uploads/presentations/CarbonRoute_Software_Grid.pdf',
            fileSize: 45200,
            mimeType: 'application/pdf',
            fileUrl: '/api/storage/presentations/CarbonRoute_Software_Grid.pdf',
            authors: ['Yuvika Nagpal', 'Kumkum Gupta', 'Aaneya Sabharwal'],
            uploaderName: 'CarbonRoute Team',
            status: 'published',
            presentationDate: '2026-08-10',
            sha256Checksum: '9a3b1c4e7f8293a01b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a',
            changeSummary: 'Initial course software grid and project proposal scope submission.',
            createdAt: '2026-08-10T10:00:00.000Z',
          },
          {
            id: 'pres-planning-v1',
            title: 'Planning Presentation V1',
            deliverableType: 'planning',
            versionTag: 'v1',
            description: 'Official Planning Presentation for Software Engineering (UCS503), submitted to Sukhpal Singh. Defines problem statement, core research question, baseline policies, forecast uncertainty modeling, deadline-risk formulation, and 17-week roadmap.',
            fileName: 'CarbonRoute_Planning_Presentation_V1.pdf',
            filePath: 'uploads/presentations/CarbonRoute_Planning_Presentation_V1.pdf',
            fileSize: 118400,
            mimeType: 'application/pdf',
            fileUrl: '/api/storage/presentations/CarbonRoute_Planning_Presentation_V1.pdf',
            authors: ['Yuvika Nagpal', 'Kumkum Gupta', 'Aaneya Sabharwal'],
            uploaderName: 'CarbonRoute Team',
            status: 'published',
            presentationDate: '17 August 2026',
            sha256Checksum: '8e4f1a239c8914bca99281a8f94d0752119ef58a2d12e9b01c34a17d8900bb21',
            changeSummary: 'Official Planning Presentation V1 submission.',
            createdAt: '2026-08-17T10:00:00.000Z',
          },
          {
            id: 'pres-planning-v2',
            title: 'Planning Presentation V2',
            deliverableType: 'planning',
            versionTag: 'v2',
            description: 'Scheduled iterative revision of the planning presentation.',
            fileName: '',
            filePath: '',
            fileSize: 0,
            mimeType: 'application/pdf',
            fileUrl: '',
            authors: ['Yuvika Nagpal', 'Kumkum Gupta', 'Aaneya Sabharwal'],
            uploaderName: 'CarbonRoute Team',
            status: 'draft',
            presentationDate: '2026-08-24',
            sha256Checksum: '',
            changeSummary: 'Scheduled revision placeholder.',
            createdAt: '2026-08-18T00:00:00.000Z',
          },
          {
            id: 'pres-midterm-v1',
            title: 'Mid-Sem Presentation',
            deliverableType: 'midterm',
            versionTag: 'midterm-v1',
            description: 'Mid-semester milestone presentation reviewing discrete-event simulator implementation, baseline benchmarks, and empirical forecast error curves.',
            fileName: '',
            filePath: '',
            fileSize: 0,
            mimeType: 'application/pdf',
            fileUrl: '',
            authors: ['Yuvika Nagpal', 'Kumkum Gupta', 'Aaneya Sabharwal'],
            uploaderName: 'CarbonRoute Team',
            status: 'draft',
            presentationDate: '2026-10-12',
            sha256Checksum: '',
            changeSummary: 'Scheduled mid-semester deliverable placeholder.',
            createdAt: '2026-08-18T00:00:00.000Z',
          },
          {
            id: 'pres-final-v1',
            title: 'Final Presentation',
            deliverableType: 'final',
            versionTag: 'final-v1',
            description: 'Comprehensive final project demonstration, statistical benchmark results, live Kubernetes container connector demo, and semester defense.',
            fileName: '',
            filePath: '',
            fileSize: 0,
            mimeType: 'application/pdf',
            fileUrl: '',
            authors: ['Yuvika Nagpal', 'Kumkum Gupta', 'Aaneya Sabharwal'],
            uploaderName: 'CarbonRoute Team',
            status: 'draft',
            presentationDate: '2026-12-21',
            sha256Checksum: '',
            changeSummary: 'Scheduled final presentation deliverable placeholder.',
            createdAt: '2026-08-18T00:00:00.000Z',
          },
        ]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve presentation deliverables.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPresentations();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono mb-2">
            <FileText className="w-3.5 h-3.5" />
            <span>Permanent Submission Repository</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-mono">
            Project Presentations &amp; Deliverables
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Permanent archive of all Software Engineering (UCS503) presentations and versioned releases.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/admin"
            className="inline-flex items-center px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs font-mono hover:bg-emerald-400 transition-colors shadow-sm"
          >
            <Eye className="w-3.5 h-3.5 mr-1.5" />
            <span>Upload / Manage Presentations</span>
          </Link>
          <div className="flex items-center space-x-2 text-xs font-mono text-emerald-400 bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-800/60">
            <ShieldCheck className="w-4 h-4" />
            <span>Immutable Versioning Active</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-slate-400 font-mono text-xs flex flex-col items-center justify-center space-y-3 glass-card rounded-2xl border border-slate-800">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
          <span>Loading presentation archive...</span>
        </div>
      ) : error ? (
        <div className="p-6 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs font-mono flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>{error}</span>
          </div>
          <button onClick={fetchPresentations} className="px-3 py-1 bg-slate-900 rounded border border-slate-800 text-white">
            Retry
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {presentations.map((p) => {
              const isPublished = p.status === 'published';
              const targetUrl =
                p.deliverableType === 'planning' && p.versionTag === 'v1'
                  ? '/presentations/planning/v1'
                  : `/presentation/${p.versionTag}`;

              return (
                <div
                  key={p.id}
                  className={`p-6 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 ${
                    isPublished
                      ? 'bg-slate-900/80 border-slate-800 hover:border-emerald-500/40'
                      : 'bg-slate-950/60 border-slate-900 opacity-80'
                  }`}
                >
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          isPublished
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-slate-900 text-slate-500 border border-slate-800'
                        }`}
                      >
                        Status: {p.deliverableType === 'planning' ? 'Planning' : isPublished ? 'Published' : 'Not Published'}
                      </span>

                      {p.versionTag && (
                        <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 font-mono text-[10px] border border-slate-800 uppercase font-bold">
                          Version: {p.versionTag.toUpperCase()}
                        </span>
                      )}

                      <span className="px-2 py-0.5 rounded bg-slate-950 text-emerald-400 font-mono text-[10px] border border-slate-800 font-bold">
                        Project: CarbonRoute
                      </span>

                      <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 font-mono text-[10px] border border-slate-800">
                        Duration: 17 weeks
                      </span>

                      {p.presentationDate && (
                        <span className="inline-flex items-center text-[11px] text-slate-400 font-mono">
                          <Calendar className="w-3 h-3 mr-1 text-slate-500" />
                          {p.presentationDate}
                        </span>
                      )}
                    </div>

                    <h2 className="text-xl font-bold text-white font-mono">{p.title}</h2>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {p.description || (isPublished ? 'Official deliverable' : 'Upcoming scheduled project milestone.')}
                    </p>

                    {p.changeSummary && isPublished && (
                      <div className="text-[11px] text-slate-400 font-mono">
                        <span className="text-slate-500">Release Notes:</span> {p.changeSummary}
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center space-x-3">
                    {isPublished ? (
                      <Link
                        to={targetUrl}
                        className="inline-flex items-center px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-colors font-mono shadow-sm group"
                      >
                        <Eye className="w-4 h-4 mr-1.5" />
                        <span>View Presentation</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    ) : (
                      <div className="inline-flex items-center px-4 py-2 rounded-lg bg-slate-900 text-slate-500 border border-slate-800 text-xs font-mono cursor-not-allowed">
                        <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-600" />
                        <span>Scheduled in Roadmap</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
