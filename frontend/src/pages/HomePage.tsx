import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Zap,
  FileText,
  Compass,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Layers,
  Activity,
  Server,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Users,
  Database,
  BarChart3,
  Flame,
  Globe,
  Sliders,
  Terminal,
  Clock,
  HelpCircle,
  XCircle,
  Milestone,
  Check,
  X,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(3);

  const builtNowItems = [
    { title: 'Project Website', desc: 'Permanent versioned project web platform for UCS503 Software Engineering.' },
    { title: 'Project Overview & Specification', desc: 'Comprehensive definition of problem, motivation, methodology, and 10 research sections.' },
    { title: 'Team Information', desc: 'Team TriFlux member profiles (Yuvika Nagpal, Kumkum Gupta, Aaneya Sabharwal).' },
    { title: 'Planning Presentation V1', desc: 'Official 25-slide planning presentation with in-browser PDF viewer and download.' },
    { title: 'Initial System Architecture', desc: 'System topology, multi-tier software design, and module interaction pipeline.' },
    { title: 'Project Scope & Research Question', desc: 'Rigorous boundaries (in-scope, out-of-scope, and software-only constraints).' },
  ];

  const plannedItems = [
    { title: 'Workload Simulator', desc: 'Discrete-event simulation modeling cloud regions, capacity limits, and electricity costs.' },
    { title: 'Benchmark Dataset / Trace Model', desc: 'Carbon intensity trace generation and forecast error dataset pipeline.' },
    { title: 'Baseline Schedulers', desc: 'Immediate execution, Earliest Deadline First (EDF), and Cost-Aware schedulers.' },
    { title: 'Carbon-Aware Scheduler', desc: 'Deterministic carbon heuristic and CarbonRoute optimization algorithms.' },
    { title: 'Forecast Uncertainty Modelling', desc: 'Parametric and empirical forecast error distribution engine across horizons.' },
    { title: 'Risk Calibration', desc: 'Reliability diagrams, Brier score, and Expected Calibration Error (ECE) metrics.' },
    { title: 'Stress Testing', desc: 'Robustness testing under capacity drops, price spikes, and forecast error shocks.' },
    { title: 'Scheduling API', desc: 'FastAPI REST service for workload submission and constraint-aware recommendations.' },
    { title: 'Experiment Dashboard', desc: 'Interactive visual analytics for schedule comparisons and uncertainty curves.' },
    { title: 'Workload Connector', desc: 'Dispatcher to Kubernetes Jobs / container runners with explanation summaries.' },
    { title: 'Final Evaluation & Deployment', desc: 'Statistically paired benchmark runs, reproducible scripts, and final viva delivery.' },
  ];

  const roadmapMilestones = [
    { weeks: 'Weeks 1–2', phase: 'Requirements & research', milestone: 'Scope frozen (Current Phase)', active: true },
    { weeks: 'Weeks 3–4', phase: 'Job/region/trace models', milestone: 'Simulation base' },
    { weeks: 'Weeks 5–6', phase: 'Immediate + EDF + cost', milestone: 'Baselines' },
    { weeks: 'Weeks 7–8', phase: 'CarbonAware + Oracle', milestone: 'Baseline set complete' },
    { weeks: 'Weeks 9–10', phase: 'Forecast error + versioning', milestone: 'Trace pipeline' },
    { weeks: 'Weeks 11–12', phase: 'Uncertainty + calibration', milestone: 'Risk model' },
    { weeks: 'Week 13', phase: 'Stress testing', milestone: 'Robustness results' },
    { weeks: 'Week 14', phase: 'API + dashboard', milestone: 'Hosted prototype' },
    { weeks: 'Week 15', phase: 'Repeated experiments', milestone: 'Statistical results' },
    { weeks: 'Week 16', phase: 'Testing + deployment + connector', milestone: 'End-to-end demo' },
    { weeks: 'Week 17', phase: 'Final results + viva', milestone: 'Final delivery' },
  ];

  const pipelineSteps = [
    {
      id: 1,
      title: 'Workload',
      desc: 'Batch ML jobs, backups, data pipelines with flexible deadlines',
      icon: Cpu,
      detail: 'Containerized batch specification including execution duration, arrival timestamp, and target deadline.',
    },
    {
      id: 2,
      title: 'Cloud Regions',
      desc: 'Multi-region compute capacity, carbon intensity, and electricity costs',
      icon: Globe,
      detail: 'Simulates diverse geographically distributed grid zones with distinct renewable profiles.',
    },
    {
      id: 3,
      title: 'Carbon Forecast',
      desc: 'Noisy predictions with horizon-dependent forecast error variance',
      icon: Activity,
      detail: 'Forecast curves with parametric and empirical error distributions modeling uncertainty growth over time.',
    },
    {
      id: 4,
      title: 'Scheduling',
      desc: 'Spatial and temporal job shifting optimization algorithms',
      icon: Zap,
      detail: 'Compares Immediate, EDF, Cost-Aware, Carbon-Aware, and Uncertainty-Aware schedulers.',
    },
    {
      id: 5,
      title: 'Risk',
      desc: 'Calibrated estimation of P(deadline violation | decision)',
      icon: ShieldCheck,
      detail: 'Rigorous probability calibration using Brier score and Reliability Diagrams to protect SLAs.',
    },
    {
      id: 6,
      title: 'Decision',
      desc: 'Risk-bounded green dispatch window with structured rationale',
      icon: CheckCircle2,
      detail: 'Executes job at optimal renewable window while strictly ensuring violation probability <= risk tolerance.',
    },
  ];

  const plannedComponents = [
    {
      title: 'Simulator',
      desc: 'Discrete-event simulator modeling cloud regions, workloads, dynamic grid carbon intensity, capacity limits, and electricity costs.',
      icon: Database,
    },
    {
      title: 'Scheduling Engine',
      desc: 'Optimization solver implementing baseline policies (Immediate, EDF, Cost-Aware), deterministic carbon heuristics, and uncertainty-aware algorithms.',
      icon: Zap,
    },
    {
      title: 'Uncertainty Modelling',
      desc: 'Parametric and empirical forecast error distribution engine modeling variance growth across 1h to 48h look-ahead horizons.',
      icon: Activity,
    },
    {
      title: 'Risk Calibration',
      desc: 'Statistical probability calibrator utilizing Brier scores and Reliability Diagrams to ensure P(deadline violation) is well-calibrated.',
      icon: ShieldCheck,
    },
    {
      title: 'Stress Testing',
      desc: 'Robustness testing suite injecting sudden renewable drops, capacity bottlenecks, and extreme forecast error shocks.',
      icon: Flame,
    },
    {
      title: 'Reproducible Benchmark',
      desc: 'Multi-region, multi-seed evaluation benchmark with versioned trace datasets and automated statistical validation suites.',
      icon: BarChart3,
    },
    {
      title: 'API Service',
      desc: 'FastAPI REST service exposing scheduling endpoints, decision justifications, and workload submission endpoints.',
      icon: Terminal,
    },
    {
      title: 'Experiment Dashboard',
      desc: 'Interactive visual analytics dashboard for tracking forecast uncertainty curves, schedule comparisons, and risk metrics.',
      icon: Layers,
    },
    {
      title: 'Workload Connector',
      desc: 'Execution connector dispatching scheduled batch workloads to Kubernetes Jobs / container runners with explanation summaries.',
      icon: Server,
    },
  ];

  return (
    <div className="space-y-20 py-8">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-8 pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          {/* Status Badge */}
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold">PLANNING PHASE</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300 font-semibold">Team TriFlux</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">Software Engineering (UCS503)</span>
          </div>

          {/* Hero Title */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight font-mono">
              CARBON<span className="text-emerald-400">ROUTE</span>
            </h1>
            <p className="text-xl sm:text-2xl font-bold text-slate-200 tracking-tight max-w-4xl mx-auto leading-snug">
              A Reproducible Benchmark and Deadline-Risk Calibrator for Carbon-Aware Batch Scheduling under Forecast Error
            </p>
          </div>

          {/* Short description */}
          <p className="text-base sm:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
            CarbonRoute is a software-only system for scheduling flexible batch workloads while reducing realized carbon emissions under uncertain carbon-intensity forecasts.
          </p>

          {/* Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              to="/project"
              className="inline-flex items-center px-6 py-3 rounded-xl bg-slate-900 text-slate-100 hover:text-white border border-slate-700 hover:border-emerald-500/60 font-bold text-sm transition-all font-mono shadow-md"
            >
              <Compass className="w-4 h-4 mr-2 text-emerald-400" />
              <span>Explore Project</span>
            </Link>

            <Link
              to="/presentations/planning/v1"
              className="inline-flex items-center px-6 py-3 rounded-xl bg-emerald-500 text-slate-950 font-bold text-sm hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-950/60 group font-mono"
            >
              <FileText className="w-4 h-4 mr-2" />
              <span>Planning Presentation V1</span>
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* 2. DEDICATED PROJECT STATUS SECTION: BUILT NOW vs PLANNED FOR 17-WEEK DEVELOPMENT */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="text-center space-y-2 max-w-3xl mx-auto">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Transparent Project Status</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
              Project Status &amp; Deliverables Breakdown
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 font-sans">
              Clear distinction between what is currently built for the Planning Presentation and what is proposed for the 17-week development semester.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Column A: BUILT / AVAILABLE NOW */}
            <div className="glass-card rounded-2xl p-6 sm:p-8 border border-emerald-500/40 bg-slate-950/80 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-emerald-900/60">
                <div className="space-y-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 uppercase">
                    Current Phase
                  </span>
                  <h3 className="text-xl font-bold text-white font-mono flex items-center space-x-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>BUILT / AVAILABLE NOW</span>
                  </h3>
                </div>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded border border-emerald-800/80 font-bold">
                  6 Modules
                </span>
              </div>

              <div className="space-y-3 font-mono text-xs">
                {builtNowItems.map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1 hover:border-emerald-500/30 transition-colors">
                    <div className="flex items-center text-emerald-300 font-bold space-x-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{item.title}</span>
                    </div>
                    <p className="text-slate-400 text-[11px] font-sans pl-5 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Column B: PLANNED FOR THE 17-WEEK DEVELOPMENT */}
            <div className="glass-card rounded-2xl p-6 sm:p-8 border border-amber-500/40 bg-slate-950/80 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-amber-900/60">
                <div className="space-y-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-950 text-amber-300 border border-amber-800 uppercase">
                    Proposed Implementation
                  </span>
                  <h3 className="text-xl font-bold text-white font-mono flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-amber-400" />
                    <span>PLANNED FOR 17-WEEK DEV</span>
                  </h3>
                </div>
                <span className="text-xs font-mono text-amber-400 bg-amber-950/80 px-2.5 py-1 rounded border border-amber-800/80 font-bold">
                  11 Modules
                </span>
              </div>

              <div className="space-y-3 font-mono text-xs max-h-[460px] overflow-y-auto pr-1">
                {plannedItems.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-1 hover:border-amber-500/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-slate-200 font-bold space-x-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        <span>{item.title}</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-900/60">
                        Planned
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] font-sans pl-3.5 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. RESEARCH QUESTION & RESEARCH GAP (Approved Presentation Wording) */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-card rounded-2xl p-8 sm:p-10 border border-slate-800 space-y-8">
          <div className="border-b border-slate-800 pb-4 space-y-1">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
              Problem Formulation &amp; Scientific Positioning
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
              Problem Statement &amp; Research Gap
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
            <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5">
              <span className="text-amber-400 font-bold uppercase text-[11px] block">Problem</span>
              <p className="text-slate-300 font-sans text-xs leading-relaxed">
                Existing carbon-aware scheduling relies on forecasts that may contain bias, random error or missing values. Capacity limits, price changes, workload surges and tight deadlines can further affect decisions.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5">
              <span className="text-emerald-400 font-bold uppercase text-[11px] block">Research Gap</span>
              <p className="text-slate-300 font-sans text-xs leading-relaxed">
                CarbonRoute focuses on forecast-versus-realized analysis, deadline-violation probability, risk calibration, controlled stress testing and reproducible comparison of scheduling policies.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5">
              <span className="text-teal-400 font-bold uppercase text-[11px] block">Project Positioning</span>
              <p className="text-slate-300 font-sans text-xs leading-relaxed">
                CarbonRoute does not claim to invent carbon-aware scheduling; its contribution is an uncertainty-aware, calibrated and reproducible scheduling/evaluation framework.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PROJECT SCOPE & OBJECTIVES */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-card rounded-2xl p-8 sm:p-10 border border-slate-800 space-y-8">
          <div className="border-b border-slate-800 pb-4 space-y-1">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
              Boundary &amp; Constraints
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
              Project Scope &amp; Objectives
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-mono">
            {/* In Scope */}
            <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex items-center text-emerald-400 font-bold space-x-2 text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>In Scope</span>
              </div>
              <p className="text-slate-300 font-sans leading-relaxed">
                Multi-region simulation, carbon traces, forecast-error modelling, cost/capacity modelling, scheduling algorithms, deadline-risk estimation, calibration, benchmark, dashboard, API, workload connector and public website.
              </p>
              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-white font-bold block mb-1">Core Objectives:</span>
                <p className="text-slate-400 font-sans leading-relaxed text-[11px]">
                  Implement required baselines; develop uncertainty-aware scheduling; estimate and calibrate deadline risk; run controlled experiments; report statistical comparisons; connect the API to a real software workload interface.
                </p>
              </div>
            </div>

            {/* Out of Scope & Constraints */}
            <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex items-center text-rose-400 font-bold space-x-2 text-sm">
                <XCircle className="w-4 h-4" />
                <span>Out of Scope</span>
              </div>
              <p className="text-slate-300 font-sans leading-relaxed">
                Hardware/sensors, physical data-centre control, production workload migration, complete cloud-provider replacement, LLM-based scheduling and production-scale orchestration.
              </p>
              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-amber-400 font-bold block mb-1">Project Constraint:</span>
                <p className="text-slate-300 font-sans leading-relaxed text-[11px]">
                  The project is completely software-based. No hardware component or LLM is required for scheduling logic.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. 17-WEEK ROADMAP SECTION (Slide 22) */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-card rounded-2xl p-8 sm:p-10 border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                Semester Timeline (Weeks 1–17)
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
                17-Week Development Roadmap
              </h2>
            </div>
            <Link
              to="/roadmap"
              className="inline-flex items-center px-4 py-2 rounded-xl bg-slate-900 text-slate-200 hover:text-white border border-slate-800 hover:border-slate-700 text-xs font-mono font-bold"
            >
              <span>View Full Roadmap</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5 text-emerald-400" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[11px] bg-slate-900/50">
                  <th className="py-3 px-4">Weeks</th>
                  <th className="py-3 px-4">Phase</th>
                  <th className="py-3 px-4">Target Milestone</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {roadmapMilestones.map((m, idx) => (
                  <tr key={idx} className={`hover:bg-slate-900/40 transition-colors ${m.active ? 'bg-emerald-950/20' : ''}`}>
                    <td className="py-2.5 px-4 font-bold text-white whitespace-nowrap">{m.weeks}</td>
                    <td className="py-2.5 px-4 text-slate-200">{m.phase}</td>
                    <td className="py-2.5 px-4 text-emerald-300">{m.milestone}</td>
                    <td className="py-2.5 px-4 text-right">
                      {m.active ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-slate-900 text-slate-500 border border-slate-800">
                          Planned
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 6. PROPOSED SYSTEM ARCHITECTURE & 9 PLANNED COMPONENTS */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-2 max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono">
            <Clock className="w-3.5 h-3.5" />
            <span>Planned Modules for Semester Implementation</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
            Proposed System Components
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-sans">
            Modular software architecture planned for implementation across Weeks 3 to 16.
          </p>
        </div>

        {/* 9 Planned Component Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plannedComponents.map((comp, idx) => {
            const Icon = comp.icon;
            return (
              <div
                key={idx}
                className="glass-card rounded-2xl p-6 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 relative"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/70 text-amber-400 border border-amber-800/60 font-bold uppercase">
                      Planned
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-base font-mono">{comp.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">{comp.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. TEAM TRIFLUX PREVIEW */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-card rounded-2xl p-8 border border-slate-800/80 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-400">
                Software Engineering Team &bull; UCS503
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-mono">
                Team TriFlux
              </h2>
            </div>
            <Link
              to="/team"
              className="inline-flex items-center px-4 py-2 rounded-lg bg-slate-900 text-slate-200 hover:text-white border border-slate-800 hover:border-slate-700 font-mono text-xs font-semibold"
            >
              <Users className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
              <span>Meet the Team</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
              <h3 className="font-bold text-white text-base">Yuvika Nagpal</h3>
              <div className="text-xs text-emerald-400 font-mono">Roll: 1024030141</div>
              <div className="text-xs text-slate-300 font-mono">Simulation / Data / Workload Modelling</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Discrete-event simulator, carbon-intensity trace generation, and multi-region cloud capacity models.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
              <h3 className="font-bold text-white text-base">Kumkum Gupta</h3>
              <div className="text-xs text-emerald-400 font-mono">Roll: 1024030144</div>
              <div className="text-xs text-slate-300 font-mono">Scheduling Algorithms / Uncertainty / Risk Calibration</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Baseline scheduling suite, forecast error distribution modeling, and deadline-risk calibration engine.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
              <h3 className="font-bold text-white text-base">Aaneya Sabharwal</h3>
              <div className="text-xs text-emerald-400 font-mono">Roll: 1024030147</div>
              <div className="text-xs text-slate-300 font-mono">Backend / Dashboard / Deployment / Integration</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                FastAPI backend architecture, containerized Kubernetes batch connector, and interactive experiment dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. PLANNING PRESENTATION CTA */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-card rounded-2xl p-8 md:p-10 border border-emerald-500/30 bg-gradient-to-r from-emerald-950/30 via-slate-900/60 to-teal-950/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 text-center md:text-left">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
              Official Deliverable Archive
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">
              See Our Planning Presentation
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Our 25-slide Planning Presentation defines the problem, scope, system architecture, uncertainty modeling, risk calibration, and 17-week development roadmap.
            </p>
          </div>

          <Link
            to="/presentations/planning/v1"
            className="shrink-0 px-6 py-3.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-all shadow-lg font-mono flex items-center space-x-2"
          >
            <FileText className="w-4 h-4" />
            <span>View Planning V1</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </section>
    </div>
  );
};
