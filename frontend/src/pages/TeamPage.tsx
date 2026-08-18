import React from 'react';
import { Users, ShieldCheck, Mail, Github, Linkedin, Award, BookOpen } from 'lucide-react';

export const TeamPage: React.FC = () => {
  const team = [
    {
      name: 'Yuvika Nagpal',
      role: 'Simulation / Data / Workload Modelling',
      bio: 'Responsible for discrete-event simulator architecture, electricity grid carbon-intensity trace ingestion and preprocessing, and realistic synthetic batch workload models.',
      focus: [
        'Discrete-Event Cloud Simulation Core',
        'Multi-Region Carbon Intensity & Tariff Traces',
        'Synthetic Batch Workload Generators',
        'Simulated Resource Contention Modeling',
      ],
    },
    {
      name: 'Kumkum Gupta',
      role: 'Scheduling Algorithms / Uncertainty / Risk Calibration',
      bio: 'Responsible for baseline scheduling algorithms (Immediate, EDF, Cost-Aware), forecast error distribution modeling, deadline-violation risk estimation, and probability calibration.',
      focus: [
        'Baseline Schedulers Suite & Oracle Reference',
        'Forecast Uncertainty & Error Modeling',
        'P(deadline violation | decision) Optimization',
        'Brier Score & Reliability Calibration',
      ],
    },
    {
      name: 'Aaneya Sabharwal',
      role: 'Backend / Dashboard / Deployment / Integration',
      bio: 'Responsible for the FastAPI scheduling service backend, containerized Kubernetes batch execution connectors, interactive experiment dashboard, and production deployment architecture.',
      focus: [
        'FastAPI REST Microservice & OpenAPI Spec',
        'Kubernetes Batch Job Connector & Runner',
        'Interactive Visual Analytics Dashboard',
        'Platform Deployment & Immutable Archiving',
      ],
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Top Banner */}
      <div className="border-b border-slate-800 pb-6 space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
          <Users className="w-3.5 h-3.5" />
          <span>Team TriFlux &bull; UCS503</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-mono">
          Team TriFlux
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-3xl leading-relaxed">
          Software Engineering project research team (UCS503) &mdash; CarbonRoute platform development.
        </p>
      </div>

      {/* Course Context */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-mono">
        <div className="space-y-1">
          <div><strong className="text-white">Team Name:</strong> <span className="text-emerald-400 font-bold">TriFlux</span></div>
          <div><strong className="text-white">Project:</strong> CarbonRoute (Software Engineering Project)</div>
          <div><strong className="text-white">Course:</strong> Software Engineering (UCS503)</div>
          <div><strong className="text-white">Submitted to:</strong> Sukhpal Singh</div>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-300">
          Academic Year: 2026
        </div>
      </div>

      {/* Team Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {team.map((member) => (
          <div
            key={member.name}
            className="glass-card rounded-2xl p-6 border border-slate-800/80 flex flex-col justify-between space-y-6 hover:border-slate-700 transition-colors"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold font-mono text-lg">
                {member.name.split(' ').map((n) => n[0]).join('')}
              </div>

              <div>
                <h2 className="text-xl font-bold text-white font-mono">{member.name}</h2>
                <div className="text-xs text-emerald-400 font-mono font-semibold mt-1">
                  {member.role}
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {member.bio}
              </p>

              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <span className="text-[11px] font-mono text-slate-400 font-semibold block uppercase">
                  Primary Responsibilities:
                </span>
                <ul className="space-y-1 text-xs text-slate-300 font-mono">
                  {member.focus.map((f, idx) => (
                    <li key={idx} className="flex items-start space-x-1.5">
                      <span className="text-emerald-400 font-bold">&bull;</span>
                      <span className="text-[11px]">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Shared Responsibilities Banner (Required) */}
      <div className="p-6 rounded-2xl bg-emerald-950/20 border border-emerald-500/40 text-center space-y-2">
        <div className="flex items-center justify-center space-x-2 text-emerald-400 font-bold font-mono text-sm">
          <ShieldCheck className="w-5 h-5" />
          <span>Shared Responsibilities</span>
        </div>
        <p className="text-xs sm:text-sm text-slate-300 font-mono max-w-2xl mx-auto leading-relaxed">
          &ldquo;Testing, documentation, evaluation and presentation are shared responsibilities.&rdquo;
        </p>
      </div>
    </div>
  );
};
