import React, { useState } from 'react';
import {
  Layers,
  Cpu,
  Globe,
  Database,
  Zap,
  Activity,
  ShieldCheck,
  Flame,
  BarChart3,
  Terminal,
  Server,
  HardDrive,
  Code2,
  ExternalLink,
  Info,
} from 'lucide-react';

export const ArchitecturePage: React.FC = () => {
  const [selectedPipelineNode, setSelectedPipelineNode] = useState<string>('scheduling-engine');
  const [selectedAppNode, setSelectedAppNode] = useState<string>('fastapi-backend');

  const pipelineNodes = [
    {
      id: 'workload-generator',
      name: 'Workload Generator',
      category: 'Input Layer',
      icon: Cpu,
      summary: 'Generates synthetic and trace-based batch workloads (short, medium, long job classes) with arrival times, duration, resource demands, and deadlines.',
      details: 'Models production computing profiles including machine learning training batches, large-scale data transformation jobs, scheduled database backups, and video rendering pipelines with flexible slack tolerances.',
    },
    {
      id: 'cloud-simulator',
      name: 'Cloud / Region Simulator',
      category: 'Environment Layer',
      icon: Globe,
      summary: 'Simulates discrete-time cloud regions, electricity grid carbon intensity (gCO2eq/kWh), electricity tariffs, and node capacity limits.',
      details: 'Maintains discrete time-series states across multiple simulated data-center regions (e.g. US-East, Europe-North, US-West) with varying renewable penetration levels.',
    },
    {
      id: 'trace-builder',
      name: 'Trace Builder',
      category: 'Data Layer',
      icon: Database,
      summary: 'Standardizes historical forecast traces, realized actual grid intensity ground-truth, and regional spot pricing feeds into versioned dataset traces.',
      details: 'Ensures reproducible benchmark evaluation by packing aligned timestamp intervals with both forecast estimates and realized outcomes.',
    },
    {
      id: 'scheduling-engine',
      name: 'Scheduling Engine',
      category: 'Optimization Core',
      icon: Zap,
      summary: 'Evaluates and dispatches jobs across Immediate, EDF, Cost-Aware, Deterministic Carbon, Baseline, Uncertainty-Aware, and Oracle solvers.',
      details: 'Executes optimization algorithms balancing expected carbon emissions, monetary electricity costs, and deadline violation risks.',
    },
    {
      id: 'risk-uncertainty-model',
      name: 'Risk & Uncertainty Model',
      category: 'Statistical Layer',
      icon: Activity,
      summary: 'Computes multi-horizon forecast error distributions and evaluates P(deadline violation | scheduling decision) using calibrated probabilities.',
      details: 'Models horizon-dependent variance growth (1h to 48h look-ahead) and calculates Brier scores and Reliability Diagrams.',
    },
    {
      id: 'experiment-engine',
      name: 'Experiment / Stress-Test Engine',
      category: 'Evaluation Layer',
      icon: Flame,
      summary: 'Executes parametric stress testing against sudden renewable drop-offs, severe forecast errors, and spot capacity bottlenecks.',
      details: 'Tests scheduler resilience under adverse grid conditions, unexpected carbon forecast spikes, and cluster contention.',
    },
    {
      id: 'metrics-benchmark',
      name: 'Metrics & Benchmark',
      category: 'Benchmarking Layer',
      icon: BarChart3,
      summary: 'Aggregates carbon emissions, monetary cost, job delays, SLA violation rates, Brier scores, and Oracle regret into standardized benchmark reports.',
      details: 'Produces paired statistical evaluations with multi-seed variance analysis for academic research reproducibility.',
    },
    {
      id: 'api-dashboard',
      name: 'API + Dashboard',
      category: 'Interface Layer',
      icon: Terminal,
      summary: 'Exposes scheduling decision endpoints via FastAPI REST routes and provides an interactive visual dashboard for live monitoring.',
      details: 'Delivers transparent schedule explanations, risk tolerance configuration, and live visualization of carbon forecast distributions.',
    },
  ];

  const appNodes = [
    {
      id: 'react-frontend',
      name: 'React Frontend',
      tech: 'React 18 + TypeScript + Tailwind CSS',
      icon: Code2,
      summary: 'Interactive web client hosting the public research platform, versioned presentations archive, and scheduling analytics UI.',
      details: 'Built with modular TypeScript components, responsive layouts, embedded PDF presentation viewing, and real-time visual charts.',
    },
    {
      id: 'fastapi-backend',
      name: 'FastAPI Backend',
      tech: 'FastAPI + Python / Node Express',
      icon: Terminal,
      summary: 'High-performance REST API handling authentication, presentation document storage, metadata registry, and scheduling endpoints.',
      details: 'Exposes clean OpenAPI-documented endpoints for workload submission, schedule optimization queries, and versioned file downloads.',
    },
    {
      id: 'sim-scheduling-services',
      name: 'Simulation / Scheduling Services',
      tech: 'Python Core Simulation & Optimization Modules',
      icon: Zap,
      summary: 'Modular discrete-event simulator engine, forecast error modelers, and constraint optimization solvers.',
      details: 'Implements discrete-event event queues, probability calibration math, and container execution dispatch connectors.',
    },
    {
      id: 'database-storage',
      name: 'Database + Object Storage',
      tech: 'JSON DB / PostgreSQL + Object Storage (S3 / Local)',
      icon: HardDrive,
      summary: 'Persistent storage for user credentials, presentation metadata, audit logs, and versioned PDF/PPTX deliverable files.',
      details: 'Provides immutable version retention, SHA-256 cryptographic checksums, and secure access-controlled storage buckets.',
    },
  ];

  const activePipelineNode = pipelineNodes.find((n) => n.id === selectedPipelineNode) || pipelineNodes[3];
  const activeAppNode = appNodes.find((n) => n.id === selectedAppNode) || appNodes[1];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
      {/* Top Banner */}
      <div className="border-b border-slate-800 pb-6 space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
          <Layers className="w-3.5 h-3.5" />
          <span>System &amp; Application Architecture</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-mono">
          CarbonRoute Architecture
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-3xl leading-relaxed">
          Clean modular design separating workload modeling, discrete-event simulation, forecast uncertainty calibration, and container execution.
        </p>
      </div>

      {/* 1. PIPELINE ARCHITECTURE (Clickable Interactive Flow) */}
      <section className="glass-card rounded-2xl p-8 border border-slate-800/80 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
          <div>
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
              Architecture Model 1
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-mono">
              Scientific Pipeline Architecture
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Click any component to inspect technical details
          </span>
        </div>

        {/* Clickable Pipeline Nodes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          {pipelineNodes.map((node, idx) => {
            const Icon = node.icon;
            const isSelected = selectedPipelineNode === node.id;
            return (
              <button
                key={node.id}
                onClick={() => setSelectedPipelineNode(node.id)}
                className={`p-4 rounded-xl text-left transition-all flex flex-col justify-between space-y-3 relative ${
                  isSelected
                    ? 'bg-emerald-950/40 border-2 border-emerald-500 shadow-lg shadow-emerald-950/50'
                    : 'bg-slate-900/80 border border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                    0{idx + 1}
                  </span>
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`} />
                </div>
                <div>
                  <h3 className={`font-bold text-xs font-mono ${isSelected ? 'text-emerald-300' : 'text-white'}`}>
                    {node.name}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{node.category}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Component Explanation Box */}
        <div className="p-6 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <activePipelineNode.icon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-mono">{activePipelineNode.name}</h3>
              <span className="text-xs text-emerald-400 font-mono">{activePipelineNode.category}</span>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-mono">
            {activePipelineNode.summary}
          </p>
          <p className="text-xs text-slate-400 leading-relaxed pt-1">
            {activePipelineNode.details}
          </p>
        </div>
      </section>

      {/* 2. FUTURE APPLICATION ARCHITECTURE */}
      <section className="glass-card rounded-2xl p-8 border border-slate-800/80 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
          <div>
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
              Architecture Model 2
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-mono">
              Future Software Engineering Application Stack
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Full-stack system topology
          </span>
        </div>

        {/* 4 Layers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {appNodes.map((layer) => {
            const Icon = layer.icon;
            const isSelected = selectedAppNode === layer.id;
            return (
              <button
                key={layer.id}
                onClick={() => setSelectedAppNode(layer.id)}
                className={`p-5 rounded-xl text-left transition-all flex flex-col justify-between space-y-3 ${
                  isSelected
                    ? 'bg-teal-950/40 border-2 border-teal-500 shadow-lg shadow-teal-950/50'
                    : 'bg-slate-900/80 border border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-teal-400">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className={`font-bold text-sm font-mono ${isSelected ? 'text-teal-300' : 'text-white'}`}>
                    {layer.name}
                  </h3>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">{layer.tech}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected App Layer Explanation */}
        <div className="p-6 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <activeAppNode.icon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-mono">{activeAppNode.name}</h3>
              <span className="text-xs text-teal-400 font-mono">{activeAppNode.tech}</span>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-mono">
            {activeAppNode.summary}
          </p>
          <p className="text-xs text-slate-400 leading-relaxed pt-1">
            {activeAppNode.details}
          </p>
        </div>
      </section>
    </div>
  );
};
