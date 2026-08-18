import React, { useState } from 'react';
import {
  LayoutDashboard,
  Cpu,
  Sliders,
  Zap,
  Activity,
  BarChart3,
  ShieldCheck,
  Compass,
  Clock,
  AlertCircle,
  Play,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('workload');

  const dashboardSections = [
    { id: 'workload', name: 'Submit Workload', icon: Cpu },
    { id: 'experiment', name: 'Configure Experiment', icon: Sliders },
    { id: 'policy', name: 'Scheduling Policy', icon: Zap },
    { id: 'forecast', name: 'Forecast Uncertainty', icon: Activity },
    { id: 'results', name: 'Results', icon: BarChart3 },
    { id: 'risk', name: 'Risk Calibration', icon: ShieldCheck },
    { id: 'benchmark', name: 'Benchmark Comparison', icon: Compass },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono mb-2">
            <Clock className="w-3.5 h-3.5" />
            <span>Coming During Development (Weeks 14–16)</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-mono">
            CarbonRoute Scheduling Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Interactive control interface for workload submission, policy evaluation, risk calibration, and live benchmark execution.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-amber-400 bg-amber-950/40 px-3 py-1.5 rounded-lg border border-amber-800/60">
          <Info className="w-4 h-4" />
          <span>UI Architecture Preview</span>
        </div>
      </div>

      {/* Development Status Notice */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono text-slate-300 flex items-start space-x-3">
        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="text-white block">Academic Integrity Notice:</strong>
          <p className="text-slate-400">
            In accordance with research evaluation standards, no simulated or fabricated results are displayed ahead of the simulation engine integration in Phase 8 (Week 14).
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3 text-xs font-mono">
        {dashboardSections.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-lg border transition-all flex items-center space-x-2 ${
                isActive
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* 1. Submit Workload */}
      {activeTab === 'workload' && (
        <div className="glass-card rounded-2xl p-8 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white font-mono flex items-center space-x-2">
              <Cpu className="w-5 h-5 text-emerald-400" />
              <span>1. Submit Batch Workload Specification</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-800">
              Coming During Development
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs font-mono opacity-80">
            <div className="space-y-1">
              <label className="text-slate-400">Workload Type</label>
              <input
                type="text"
                disabled
                placeholder="ML Training / Data Transformation"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-500 cursor-not-allowed"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-400">Estimated Duration (Hours)</label>
              <input
                type="number"
                disabled
                placeholder="4"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-500 cursor-not-allowed"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-400">Hard Deadline (Hours)</label>
              <input
                type="number"
                disabled
                placeholder="16"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      )}

      {/* 2. Configure Experiment */}
      {activeTab === 'experiment' && (
        <div className="glass-card rounded-2xl p-8 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white font-mono flex items-center space-x-2">
              <Sliders className="w-5 h-5 text-teal-400" />
              <span>2. Configure Simulation Experiment</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-800">
              Coming During Development
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono opacity-80">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <span className="text-white font-bold block">Cloud Regions</span>
              <p className="text-slate-400 text-[11px]">US-East, Europe-North, US-West grid zones</p>
            </div>
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <span className="text-white font-bold block">Capacity Limits</span>
              <p className="text-slate-400 text-[11px]">Dynamic spot node availability constraints</p>
            </div>
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <span className="text-white font-bold block">Simulation Horizon</span>
              <p className="text-slate-400 text-[11px]">24h to 168h discrete-time simulation window</p>
            </div>
          </div>
        </div>
      )}

      {/* 3. Scheduling Policy */}
      {activeTab === 'policy' && (
        <div className="glass-card rounded-2xl p-8 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white font-mono flex items-center space-x-2">
              <Zap className="w-5 h-5 text-emerald-400" />
              <span>3. Policy Selection &amp; Constraint Config</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-800">
              Coming During Development
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs font-mono opacity-80">
            {['Immediate', 'Earliest Deadline First', 'Cost-Aware', 'Deterministic Carbon', 'CarbonRoute (Proposed)', 'Oracle Reference'].map((pol) => (
              <div key={pol} className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-slate-300">
                {pol}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Forecast Uncertainty */}
      {activeTab === 'forecast' && (
        <div className="glass-card rounded-2xl p-8 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white font-mono flex items-center space-x-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              <span>4. Forecast Uncertainty &amp; Error Variance</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-800">
              Coming During Development
            </span>
          </div>

          <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800 text-slate-500 font-mono text-xs">
            Multi-horizon error distribution curves and variance bounds will be rendered here upon Phase 4 module integration.
          </div>
        </div>
      )}

      {/* 5. Results */}
      {activeTab === 'results' && (
        <div className="glass-card rounded-2xl p-8 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white font-mono flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
              <span>5. Simulation Results</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-800">
              Coming During Development
            </span>
          </div>

          <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800 text-slate-500 font-mono text-xs">
            Actual metrics (Carbon gCO2eq, Cost, Delay, Deadline Violations) will populate dynamically during benchmarking.
          </div>
        </div>
      )}

      {/* 6. Risk Calibration */}
      {activeTab === 'risk' && (
        <div className="glass-card rounded-2xl p-8 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white font-mono flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>6. Risk Calibration &amp; Reliability Diagrams</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-800">
              Coming During Development
            </span>
          </div>

          <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800 text-slate-500 font-mono text-xs">
            Brier score graphs, reliability plots, and ECE curves will be generated from repeated multi-seed evaluations in Phase 5.
          </div>
        </div>
      )}

      {/* 7. Benchmark Comparison */}
      {activeTab === 'benchmark' && (
        <div className="glass-card rounded-2xl p-8 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white font-mono flex items-center space-x-2">
              <Compass className="w-5 h-5 text-teal-400" />
              <span>7. Reproducible Benchmark Comparison</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-800">
              Coming During Development
            </span>
          </div>

          <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800 text-slate-500 font-mono text-xs">
            Side-by-side comparative matrices against 5 baseline solvers and Oracle regret bounds will be displayed upon Week 15 benchmark execution.
          </div>
        </div>
      )}
    </div>
  );
};
