import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Download,
  FileText,
  Calendar,
  User,
  ShieldCheck,
  Maximize2,
  Minimize2,
  ExternalLink,
  Layers,
  UploadCloud,
  ArrowRight,
  Info,
} from 'lucide-react';
import { PresentationItem } from '../types';
import { resolveFileUrl } from '../services/api';

interface PresentationViewerProps {
  version: PresentationItem;
  allVersions?: {
    id: string;
    versionTag: string;
    title: string;
    presentationDate: string;
    changeSummary: string;
    status: string;
    createdAt: string;
  }[];
  onSelectVersion?: (versionTag: string) => void;
}

export const PresentationViewer: React.FC<PresentationViewerProps> = ({
  version,
  allVersions = [],
  onSelectVersion,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewerMode, setViewerMode] = useState<'native' | 'gdocs'>('native');

  const resolvedPdfUrl = resolveFileUrl(version.fileUrl, version.filePath, version.fileName);
  const hasFile = Boolean(resolvedPdfUrl || version.fileName);
  const pdfSource = resolvedPdfUrl || resolveFileUrl('CarbonRoute_Planning_Presentation_V1.pdf');

  const activeEmbedUrl =
    viewerMode === 'gdocs'
      ? `https://docs.google.com/viewer?url=${encodeURIComponent(pdfSource)}&embedded=true`
      : `${pdfSource}#toolbar=1&navpanes=1&scrollbar=1`;

  const handleDownload = () => {
    if (!pdfSource) return;
    const downloadUrl = pdfSource.includes('?')
      ? `${pdfSource}&download=true`
      : `${pdfSource}?download=true`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', version.fileName || `${version.title.replace(/\s+/g, '_')}.pdf`);
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noreferrer');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`space-y-8 ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-950 p-6 overflow-y-auto' : ''}`}>
      {/* 1. Header Metadata Banner */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-800/80 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Version: {version.versionTag.toUpperCase()}
              </span>
              <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                Status: Planning
              </span>
              <span className="px-2.5 py-0.5 rounded text-xs font-bold font-mono bg-slate-900 text-emerald-400 border border-slate-800">
                Project: CarbonRoute
              </span>
              <span className="px-2.5 py-0.5 rounded text-xs font-mono bg-slate-900 text-slate-300 border border-slate-800">
                Duration: 17 weeks
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-slate-900 text-teal-300 border border-slate-800">
                Team TriFlux
              </span>
              {version.authors && version.authors.length > 0 && (
                <span className="inline-flex items-center text-xs text-emerald-400 font-mono">
                  <User className="w-3.5 h-3.5 mr-1 text-slate-500" />
                  {version.authors.join(', ')}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
              {version.title}
            </h1>
            {version.description && (
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
                {version.description}
              </p>
            )}
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            {hasFile && (
              <button
                onClick={handleDownload}
                className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors font-mono shadow-sm"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Download Document
              </button>
            )}

            <Link
              to="/admin"
              className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-mono font-semibold bg-slate-900 text-slate-300 hover:text-white border border-slate-800 transition-colors"
            >
              <UploadCloud className="w-3.5 h-3.5 mr-1.5 text-teal-400" />
              Upload / Manage
            </Link>

            {hasFile && (
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>

        {/* Version Switcher Bar */}
        {allVersions.length > 0 && (
          <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center space-x-2 text-slate-400">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold text-slate-300">Version Archive:</span>
              <div className="flex items-center space-x-1.5">
                {allVersions.map((v) => {
                  const isCurrent = v.versionTag.toLowerCase() === version.versionTag.toLowerCase();
                  return (
                    <button
                      key={v.id}
                      onClick={() => onSelectVersion && onSelectVersion(v.versionTag)}
                      className={`px-2.5 py-1 rounded text-xs transition-colors ${
                        isCurrent
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-bold'
                          : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      {v.versionTag.toUpperCase()}
                      {v.versionTag === 'v1' && ' (Baseline)'}
                    </button>
                  );
                })}
              </div>
            </div>

            {version.changeSummary && (
              <span className="text-slate-400 text-[11px]">
                Notes: <strong className="text-slate-300">{version.changeSummary}</strong>
              </span>
            )}
          </div>
        )}
      </div>

      {/* 2. MAIN PRESENTATION VIEWER */}
      {hasFile ? (
        <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-2xl space-y-3 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 px-2 text-xs font-mono text-slate-400">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span className="text-white font-semibold">{version.fileName || 'Presentation Document'}</span>
            </div>

            <div className="flex items-center space-x-3">
              {/* Viewer Engine Toggle */}
              <div className="inline-flex items-center rounded-lg bg-slate-900 p-0.5 border border-slate-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => setViewerMode('native')}
                  className={`px-2 py-1 rounded transition-colors ${
                    viewerMode === 'native'
                      ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Use native browser PDF viewer"
                >
                  Direct PDF
                </button>
                <button
                  type="button"
                  onClick={() => setViewerMode('gdocs')}
                  className={`px-2 py-1 rounded transition-colors ${
                    viewerMode === 'gdocs'
                      ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Use Google Docs online document viewer"
                >
                  Cloud Viewer
                </button>
              </div>

              <a
                href={pdfSource}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:underline flex items-center space-x-1"
              >
                <span>Open in New Tab</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
            <iframe
              src={activeEmbedUrl}
              title={version.title}
              className="w-full h-[650px] rounded-xl bg-slate-950"
              allow="autoplay"
            />
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-12 border border-slate-800 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
            <UploadCloud className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white font-mono">No presentation file uploaded yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto font-mono">
              Upload your team's PDF or PowerPoint presentation via the admin dashboard to display it here.
            </p>
          </div>
          <Link
            to="/admin"
            className="inline-flex items-center px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs font-mono hover:bg-emerald-400 transition-colors shadow-sm"
          >
            <UploadCloud className="w-4 h-4 mr-1.5" />
            <span>Go to Admin Upload</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Link>
        </div>
      )}

      {/* 3. PROJECT SUMMARY */}
      <section className="glass-card rounded-2xl p-8 border border-slate-800/80 space-y-6">
        <div className="border-b border-slate-800 pb-3">
          <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
            Executive Summary
          </span>
          <h2 className="text-xl font-bold text-white font-mono mt-1">
            PROJECT SUMMARY
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          {/* Problem */}
          <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <h3 className="text-sm font-bold text-white uppercase text-rose-400">Problem</h3>
            <p className="text-slate-300 leading-relaxed font-sans">
              Carbon-aware scheduling becomes difficult when forecasts and cloud conditions are uncertain.
            </p>
          </div>

          {/* Proposed Solution */}
          <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <h3 className="text-sm font-bold text-white uppercase text-emerald-400">Proposed Solution</h3>
            <p className="text-slate-300 leading-relaxed font-sans">
              CarbonRoute simulates workloads and cloud regions, compares scheduling policies, models uncertainty and evaluates deadline-risk calibration.
            </p>
          </div>

          {/* Scope */}
          <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <h3 className="text-sm font-bold text-white uppercase text-teal-400">Scope</h3>
            <p className="text-slate-300 leading-relaxed font-sans">
              Simulator + scheduling algorithms + uncertainty modelling + benchmark + API + dashboard + workload connector.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
