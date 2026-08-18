import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PresentationViewer } from '../components/PresentationViewer';
import { api } from '../services/api';
import { PresentationItem } from '../types';
import { FileText, RefreshCw, AlertCircle } from 'lucide-react';

export const PlanningPresentationPage: React.FC = () => {
  const { versionTag = 'v1' } = useParams<{ versionTag: string }>();
  const navigate = useNavigate();
  const [version, setVersion] = useState<PresentationItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVersion = async (tag: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getPresentationByVersion(tag);
      if (res.success && res.data) {
        setVersion(res.data);
      } else {
        setError(res.message || `Presentation version "${tag}" was not found.`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load presentation version.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVersion(versionTag);
  }, [versionTag]);

  const handleSelectVersion = (tag: string) => {
    if (tag === 'v1') {
      navigate('/presentations/planning/v1');
    } else {
      navigate(`/presentation/${tag}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {loading ? (
        <div className="p-16 text-center text-slate-400 font-mono text-xs flex flex-col items-center justify-center space-y-3 glass-card rounded-2xl border border-slate-800">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
          <span>Retrieving presentation deliverable...</span>
        </div>
      ) : error || !version ? (
        <div className="p-8 rounded-2xl bg-rose-950/30 border border-rose-800/60 text-rose-300 space-y-3 font-mono text-xs">
          <div className="flex items-center space-x-2 font-bold text-sm">
            <AlertCircle className="w-5 h-5 text-rose-400" />
            <span>Version Not Found</span>
          </div>
          <p>{error || 'The requested presentation version does not exist.'}</p>
          <button
            onClick={() => navigate('/presentations/planning/v1')}
            className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white hover:bg-slate-800 font-sans"
          >
            Return to Planning Presentation V1
          </button>
        </div>
      ) : (
        <PresentationViewer
          version={version}
          allVersions={version.allVersions || []}
          onSelectVersion={handleSelectVersion}
        />
      )}
    </div>
  );
};
