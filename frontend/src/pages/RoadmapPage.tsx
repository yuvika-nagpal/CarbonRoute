import React from 'react';
import { Milestone, CheckCircle2, Clock, Calendar, ArrowRight, ShieldCheck, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export const RoadmapPage: React.FC = () => {
  const roadmapItems = [
    {
      week: 'WEEKS 1–2',
      title: 'Requirements, research and initial simulator prototype',
      status: 'active',
      desc: 'Problem formulation, literature review, mathematical model of carbon intensity and forecast error, initial simulator prototype architecture, and website deployment.',
      deliverables: ['Planning Presentation V1', 'Project Portal Deployment', 'Initial Simulator Spec'],
    },
    {
      week: 'WEEKS 3–4',
      title: 'Simulator models and workload generation',
      status: 'planned',
      desc: 'Development of discrete-event simulator core, multi-region cloud capacity and pricing models, and synthetic batch workload generators (short, medium, long jobs).',
      deliverables: ['Discrete-Event Simulator Core', 'Workload Generator Trace Engine'],
    },
    {
      week: 'WEEKS 5–6',
      title: 'Baseline scheduling policies',
      status: 'planned',
      desc: 'Implementation of reference scheduling policies: Immediate Execution, Earliest Deadline First (EDF), Cost-Aware Scheduler, and Realized-Data Oracle reference solver.',
      deliverables: ['Baseline Suite', 'Oracle Upper-Bound Reference Solver'],
    },
    {
      week: 'WEEKS 7–8',
      title: 'Carbon-aware scheduler',
      status: 'planned',
      desc: 'Implementation of deterministic carbon-aware scheduling algorithms and heuristic multi-region workload shifting strategies.',
      deliverables: ['Deterministic Carbon Scheduler', 'Trace Alignment Module'],
    },
    {
      week: 'WEEKS 9–10',
      title: 'Forecast uncertainty and error modelling',
      status: 'planned',
      desc: 'Parametric and empirical forecast error distribution modeling across 1h to 48h look-ahead horizons to capture variance growth over time.',
      deliverables: ['Forecast Error Engine', 'Multi-Horizon Error Distribution Models'],
    },
    {
      week: 'WEEKS 11–12',
      title: 'Uncertainty-aware scheduler and deadline-risk calibration',
      status: 'planned',
      desc: 'Core CarbonRoute scheduling algorithm enforcing P(deadline violation | decision) <= tau, combined with Brier score calibration and Reliability Diagrams.',
      deliverables: ['CarbonRoute Uncertainty Scheduler', 'Risk Calibration Module (Brier/ECE)'],
    },
    {
      week: 'WEEK 13',
      title: 'Stress testing',
      status: 'planned',
      desc: 'Systematic stress testing against sudden renewable drop-offs, cloud capacity contention, flash price spikes, and severe forecast skew.',
      deliverables: ['Stress-Testing Matrix', 'Degradation & Robustness Analysis'],
    },
    {
      week: 'WEEK 14',
      title: 'API and dashboard integration',
      status: 'planned',
      desc: 'FastAPI REST endpoint exposure for scheduling decisions and interactive web dashboard integration for visualizing schedules and risk curves.',
      deliverables: ['FastAPI Endpoints', 'Interactive Scheduling Dashboard'],
    },
    {
      week: 'WEEK 15',
      title: 'Large-scale repeated experiments and benchmark',
      status: 'planned',
      desc: 'Execution of multi-seed, multi-region reproducible benchmark suite across varying forecast error levels, producing paired statistical evaluations.',
      deliverables: ['Reproducible Benchmark Bundle', 'Statistical Significance Tests'],
    },
    {
      week: 'WEEK 16',
      title: 'Containerized workload connector, testing and deployment',
      status: 'planned',
      desc: 'Integration of container execution connector dispatching scheduled batch jobs to Kubernetes Jobs with explanation summaries.',
      deliverables: ['Kubernetes Workload Connector', 'End-to-End Container Runner'],
    },
    {
      week: 'WEEK 17',
      title: 'Final integration, evaluation, documentation and presentation',
      status: 'planned',
      desc: 'Comprehensive project evaluation, final documentation, open-source repository packaging, and university semester defense presentation.',
      deliverables: ['Final Project Thesis / Report', 'Final Presentation V1', 'Release Artifact'],
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Top Banner */}
      <div className="border-b border-slate-800 pb-6 space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
          <Milestone className="w-3.5 h-3.5" />
          <span>Semester Timeline (UCS503)</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-mono">
          17-Week Development Roadmap
        </h1>
        <p className="text-sm text-slate-400 max-w-3xl leading-relaxed">
          Structured 17-week implementation roadmap covering research, simulator design, uncertainty modeling, calibration, and benchmarking.
        </p>
      </div>

      {/* Critical Note */}
      <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-xs font-mono space-y-1">
        <div className="font-bold flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Platform Continuity Notice</span>
        </div>
        <p className="text-slate-300">
          The CarbonRoute website is developed and deployed from the beginning (Weeks 1–2) and operates permanently throughout the entire 17-week semester.
        </p>
      </div>

      {/* Roadmap Timeline */}
      <div className="relative border-l-2 border-slate-800 ml-4 sm:ml-6 space-y-8 pl-6 sm:pl-8">
        {roadmapItems.map((item, idx) => {
          const isActive = item.status === 'active';
          return (
            <div key={idx} className="relative group">
              {/* Timeline Bullet */}
              <div
                className={`absolute -left-[31px] sm:-left-[39px] top-1.5 w-4 h-4 rounded-full border-2 ${
                  isActive
                    ? 'bg-emerald-400 border-emerald-300 ring-4 ring-emerald-500/20'
                    : 'bg-slate-900 border-slate-700'
                }`}
              />

              <div
                className={`p-6 rounded-xl border transition-all ${
                  isActive
                    ? 'bg-emerald-950/20 border-emerald-500/50 shadow-lg shadow-emerald-950/40'
                    : 'bg-slate-900/80 border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center space-x-2.5">
                    <span
                      className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold ${
                        isActive
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {item.week}
                    </span>
                    <h3 className="font-bold text-white text-base font-mono">{item.title}</h3>
                  </div>

                  <span
                    className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded uppercase ${
                      isActive
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-slate-950 text-slate-500 border border-slate-800'
                    }`}
                  >
                    {isActive ? 'Current Phase' : 'Planned'}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans mb-4">
                  {item.desc}
                </p>

                <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-mono font-semibold">Key Deliverables:</span>
                  {item.deliverables.map((del, dIdx) => (
                    <span
                      key={dIdx}
                      className="px-2 py-0.5 rounded bg-slate-950 text-[10px] font-mono text-slate-300 border border-slate-800"
                    >
                      {del}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
