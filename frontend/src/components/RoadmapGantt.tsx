import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  CircleDashed,
  ArrowRight,
  Filter,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { RoadmapMilestone } from '../types';

interface RoadmapGanttProps {
  milestones: RoadmapMilestone[];
  onSelectMilestone?: (milestone: RoadmapMilestone) => void;
}

export const RoadmapGantt: React.FC<RoadmapGanttProps> = ({ milestones, onSelectMilestone }) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filtered = milestones.filter((m) => {
    if (filterStatus === 'all') return true;
    return m.status === filterStatus;
  });

  const getStatusBadge = (status: RoadmapMilestone['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-400" /> Completed
          </span>
        );
      case 'in-progress':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800 animate-pulse">
            <Clock className="w-3 h-3 mr-1 text-cyan-400" /> In Progress (Phase 1)
          </span>
        );
      case 'planned':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-slate-900 text-slate-400 border border-slate-800">
            <CircleDashed className="w-3 h-3 mr-1 text-slate-500" /> Planned
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Roadmap Filter Bar */}
      <div className="glass-card rounded-xl p-4 border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 text-slate-300">
          <Filter className="w-4 h-4 text-emerald-400" />
          <span className="font-mono font-semibold">Filter Milestone Status:</span>
        </div>

        <div className="flex items-center space-x-1.5 font-mono">
          {['all', 'in-progress', 'planned', 'completed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1 rounded text-xs transition-colors capitalize ${
                filterStatus === status
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Grid */}
      <div className="space-y-4">
        {filtered.map((m) => (
          <div
            key={m.id}
            onClick={() => onSelectMilestone && onSelectMilestone(m)}
            className={`glass-card glass-card-hover rounded-xl p-5 border transition-all ${
              m.status === 'in-progress'
                ? 'border-emerald-500/50 bg-slate-900/90 shadow-lg'
                : 'border-slate-800/80 bg-slate-900/60'
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-3 border-b border-slate-800/70">
              <div className="flex items-center space-x-3">
                <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-slate-950 text-emerald-400 border border-slate-800">
                  {m.phaseName || m.weekRange || `Phase ${m.displayOrder}`}
                </span>
                <h4 className="text-base font-bold text-white tracking-tight">{m.title}</h4>
              </div>
              <div className="flex items-center space-x-3">
                {getStatusBadge(m.status)}
                {(m.startDate || m.targetDate) && (
                  <span className="text-xs text-slate-400 font-mono flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1 text-slate-500" />
                    {m.startDate || ''} &rarr; {m.targetDate || ''}
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 mt-3 leading-relaxed">
              {m.description}
            </p>

            {/* Deliverables & Dependencies Badges */}
            <div className="mt-4 pt-3 border-t border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-mono text-slate-400 font-semibold mr-1">
                  Deliverables:
                </span>
                {m.deliverables?.map((d, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800 text-[11px] font-mono"
                  >
                    {d}
                  </span>
                ))}
              </div>

              {m.dependencies && m.dependencies.length > 0 && (
                <div className="flex items-center space-x-1 text-[11px] font-mono text-slate-500">
                  <span>Dependencies:</span>
                  {m.dependencies.map((dep: string, i: number) => (
                    <span key={i} className="text-slate-400 font-medium">
                      {dep}
                      {i < (m.dependencies?.length || 0) - 1 ? ', ' : ''}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
