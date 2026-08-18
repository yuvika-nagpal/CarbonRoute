import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, ShieldCheck, FileText, Compass, Layers, Milestone, LayoutDashboard, Users, Lock } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-800/80 pt-12 pb-8 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-slate-800/60">
          {/* Col 1: Brand & Academic Context */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                <Zap className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="font-bold text-lg text-white font-mono tracking-tight">CARBONROUTE</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-lg">
              A software system for evaluating carbon-aware batch scheduling when carbon forecasts,
              cloud capacity and workload conditions are uncertain.
            </p>
            <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 text-xs text-slate-300 font-mono space-y-1">
              <div><strong className="text-white">Course:</strong> Software Engineering (UCS503)</div>
              <div><strong className="text-white">Submitted to:</strong> Sukhpal Singh</div>
              <div><strong className="text-emerald-400">Team TriFlux:</strong> Yuvika Nagpal, Kumkum Gupta, Aaneya Sabharwal</div>
              <div><strong className="text-white">Status:</strong> PLANNING PHASE (17-Week Project)</div>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3 font-mono">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs font-mono">
              <li>
                <Link to="/" className="hover:text-emerald-400 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/project" className="hover:text-emerald-400 transition-colors">
                  Project Overview
                </Link>
              </li>
              <li>
                <Link to="/architecture" className="hover:text-emerald-400 transition-colors">
                  Architecture
                </Link>
              </li>
              <li>
                <Link to="/roadmap" className="hover:text-emerald-400 transition-colors">
                  17-Week Roadmap
                </Link>
              </li>
              <li>
                <Link to="/presentations" className="hover:text-emerald-400 transition-colors">
                  Presentations Archive
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Portal & Deliverables */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3 font-mono">
              Deliverables &amp; Admin
            </h4>
            <ul className="space-y-2 text-xs font-mono">
              <li>
                <Link to="/presentations/planning/v1" className="text-emerald-400 hover:underline flex items-center space-x-1 font-semibold">
                  <FileText className="w-3.5 h-3.5 mr-1" />
                  <span>Planning Presentation V1</span>
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-emerald-400 transition-colors flex items-center space-x-1">
                  <LayoutDashboard className="w-3.5 h-3.5 mr-1 text-slate-500" />
                  <span>Future Dashboard</span>
                </Link>
              </li>
              <li>
                <Link to="/team" className="hover:text-emerald-400 transition-colors flex items-center space-x-1">
                  <Users className="w-3.5 h-3.5 mr-1 text-slate-500" />
                  <span>Meet the Team</span>
                </Link>
              </li>
              <li>
                <Link to="/admin" className="text-slate-400 hover:text-white transition-colors flex items-center space-x-1">
                  <Lock className="w-3.5 h-3.5 mr-1 text-slate-500" />
                  <span>Admin / Content Management</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 space-y-3 sm:space-y-0 font-mono">
          <div>
            &copy; 2026 CarbonRoute by Team TriFlux. Software Engineering Research Platform (UCS503).
          </div>
          <div className="flex items-center space-x-2 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400">Current Phase: <strong className="text-emerald-400">PLANNING</strong></span>
          </div>
        </div>
      </div>
    </footer>
  );
};
